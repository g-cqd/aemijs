/**
 * aemijs/workers — run a function off the main thread, anywhere.
 *
 * One small module that works on browsers, Node (worker_threads), Bun and Deno.
 * It delivers the function as a `data:` module-worker URL (the single inline
 * form every runtime accepts) and speaks a tiny request/response protocol built
 * on `Promise.withResolvers()`, rejecting in-flight calls when a worker errors
 * or exits so nothing hangs forever.
 *
 * @example
 * import { run } from 'aemijs/workers';
 * const total = await run((rows) => rows.reduce((a, b) => a + b, 0), bigArray);
 */

const G = globalThis;
const isDeno = typeof G.Deno !== 'undefined';
const isBun = typeof G.Bun !== 'undefined';
const isNode = !isDeno && !isBun && typeof G.process !== 'undefined' && !!G.process?.versions?.node;

/** Runtime label, handy for debugging. @type {'deno'|'bun'|'node'|'browser'} */
export const RUNTIME = isDeno ? 'deno' : isBun ? 'bun' : isNode ? 'node' : 'browser';

/**
 * Number of logical cores, used as the default pool size.
 * @returns {number}
 */
export function hardwareConcurrency() {
    return G.navigator?.hardwareConcurrency || 4;
}

/**
 * Build the worker-side bootstrap around a user function's source.
 * The bootstrap auto-detects Node vs web transport and auto-transfers any
 * ArrayBuffers found (shallowly) in the result.
 * @param {string} fnSource
 * @returns {string}
 */
function buildWorkerSource(fnSource) {
    return `const __fn = (${fnSource});
const __g = globalThis;
const __isDeno = typeof __g.Deno !== 'undefined';
const __isBun = typeof __g.Bun !== 'undefined';
const __isNode = !__isDeno && !__isBun && typeof __g.process !== 'undefined' && !!__g.process?.versions?.node;
function __collect(v) {
    const out = [];
    const add = (x) => {
        if (x instanceof ArrayBuffer) out.push(x);
        else if (ArrayBuffer.isView(x)) out.push(x.buffer);
        else if (typeof MessagePort !== 'undefined' && x instanceof MessagePort) out.push(x);
    };
    add(v);
    if (v && typeof v === 'object' && !(v instanceof ArrayBuffer) && !ArrayBuffer.isView(v)) {
        for (const x of (Array.isArray(v) ? v : Object.values(v))) add(x);
    }
    return out;
}
let __post, __listen;
if (__isNode) {
    const { parentPort } = await import('node:worker_threads');
    __post = (m, t) => parentPort.postMessage(m, t && t.length ? t : undefined);
    __listen = (h) => parentPort.on('message', h);
} else {
    __post = (m, t) => __g.postMessage(m, t && t.length ? t : undefined);
    __listen = (h) => __g.addEventListener('message', (e) => h(e.data));
}
__post({ __ready: 1 });
__listen(async ({ id, data }) => {
    try {
        const value = await __fn(data);
        __post({ id, ok: true, value }, __collect(value));
    } catch (err) {
        __post({ id, ok: false, error: { name: err?.name ?? 'Error', message: err?.message ?? String(err), stack: err?.stack } });
    }
});`;
}

/**
 * @param {Function|string} fn
 * @returns {string}
 */
function workerSource(fn) {
    return buildWorkerSource(typeof fn === 'function' ? fn.toString() : String(fn));
}

/**
 * @param {{name?: string, message?: string, stack?: string}} e
 * @returns {Error}
 */
function reviveError(e) {
    if (!e) {
        return new Error('Unknown worker error');
    }
    const err = new Error(e.message);
    err.name = e.name ?? 'Error';
    if (e.stack) {
        err.stack = e.stack;
    }
    return err;
}

/**
 * Normalized worker handle hiding the worker_threads/Web-Worker API gap.
 * @typedef {object} Adapter
 * @property {(msg: any, transfer?: any[]) => void} postMessage
 * @property {(handler: (msg: any) => void) => void} onMessage
 * @property {(handler: (err: any) => void) => void} onError
 * @property {(handler: () => void) => void} onClose
 * @property {() => Promise<any>|void} terminate
 */

/**
 * Create a runtime-appropriate worker and normalize its event surface.
 *
 * Transport differs by necessity: Node's `worker_threads` accepts a `data:`
 * URL (and not `blob:`), while browsers/Bun/Deno take a `blob:` URL — Bun in
 * particular rejects long `data:` URLs ("NameTooLong"). The Blob URL is revoked
 * on the worker's first message (a `{ __ready }` sentinel) so nothing leaks.
 * @param {string} src
 * @returns {Promise<Adapter>}
 */
async function createWorker(src) {
    if (isNode) {
        const { Worker } = await import('node:worker_threads');
        const w = new Worker(new URL(`data:text/javascript,${encodeURIComponent(src)}`));
        return {
            postMessage: (m, t) => w.postMessage(m, t && t.length ? t : undefined),
            onMessage: (h) => w.on('message', h),
            onError: (h) => { w.on('error', h); w.on('messageerror', h); },
            onClose: (h) => w.on('exit', () => h()),
            terminate: () => w.terminate(),
        };
    }
    const blobUrl = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
    const w = new Worker(blobUrl, { type: 'module' });
    let revoked = false;
    const revoke = () => { if (!revoked) { revoked = true; URL.revokeObjectURL(blobUrl); } };
    // The URL is revoked on the worker's first message (the `__ready` sentinel)
    // or on error — never in terminate(): revoking while the module fetch is
    // still in flight races the loader (observed on Deno as "Module not found
    // blob:..." spam). A worker terminated before it ever signals ready leaks
    // one blob URL — rare and bounded.
    return {
        postMessage: (m, t) => w.postMessage(m, t && t.length ? t : undefined),
        onMessage: (h) => w.addEventListener('message', (e) => { revoke(); h(e.data); }),
        onError: (h) => {
            const wrap = (e) => { revoke(); h(e instanceof Error ? e : new Error(e?.message || 'Worker error')); };
            w.addEventListener('error', wrap);
            w.addEventListener('messageerror', wrap);
        },
        onClose: () => { /* web workers have no exit event; terminate() is the only close */ },
        terminate: () => w.terminate(),
    };
}

/**
 * Wrap an adapter in the request/response RPC layer.
 * @param {Adapter} adapter
 */
function createClient(adapter) {
    /** @type {Map<number, {resolve: Function, reject: Function}>} */
    const pending = new Map();
    let seq = 0;
    let dead = null;

    adapter.onMessage((msg) => {
        const entry = pending.get(msg.id);
        if (!entry) {
            return;
        }
        pending.delete(msg.id);
        if (msg.ok) {
            entry.resolve(msg.value);
        } else {
            entry.reject(reviveError(msg.error));
        }
    });

    const failAll = (err) => {
        dead = err;
        for (const { reject } of pending.values()) {
            reject(err);
        }
        pending.clear();
    };

    adapter.onError((err) => failAll(err instanceof Error ? err : new Error(String(err))));
    adapter.onClose(() => { if (pending.size) { failAll(new Error('Worker exited before responding')); } });

    return {
        /**
         * @param {any} data
         * @param {{transfer?: any[], signal?: AbortSignal}} [options]
         * @returns {Promise<any>}
         */
        call(data, { transfer, signal } = {}) {
            if (dead) {
                return Promise.reject(dead);
            }
            if (signal?.aborted) {
                return Promise.reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
            }
            // Integer ids: uniqueness only needs to hold per client, and a
            // counter is ~10x cheaper than crypto.randomUUID() on the wire
            // and in the Map (measured 4-8% off the whole RPC round trip).
            const id = ++seq;
            const { promise, resolve, reject } = Promise.withResolvers();
            pending.set(id, { resolve, reject });
            if (signal) {
                signal.addEventListener('abort', () => {
                    if (pending.delete(id)) {
                        reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
                    }
                }, { once: true });
            }
            adapter.postMessage({ id, data }, transfer);
            return promise;
        },
        async terminate() {
            await adapter.terminate();
            failAll(new Error('Worker terminated'));
        },
    };
}

/**
 * A reusable worker bound to one function. Call it as many times as you like,
 * then `terminate()` (or use `await using`).
 * @typedef {object} WorkerHandle
 * @property {(data?: any, options?: {transfer?: any[], signal?: AbortSignal}) => Promise<any>} call
 * @property {() => Promise<void>} terminate
 */

/**
 * Spawn a long-lived worker running `fn`. The function must be self-contained
 * (it is serialized via `toString()`, so it cannot capture outer variables).
 * @param {Function} fn
 * @returns {Promise<WorkerHandle>}
 */
export async function spawn(fn) {
    const adapter = await createWorker(workerSource(fn));
    const client = createClient(adapter);
    const handle = { call: client.call, terminate: client.terminate };
    if (Symbol.asyncDispose) {
        handle[Symbol.asyncDispose] = () => client.terminate();
    }
    return handle;
}

/**
 * One-shot: spin up a worker, run `fn(data)` off-thread, return the result, and
 * always terminate the worker afterwards.
 *
 * Worker startup is the dominant cost (~2ms on Bun, ~19ms on Node, ~13ms on
 * Deno) — use {@link spawn} or {@link WorkerPool} for repeated calls.
 * @param {Function} fn
 * @param {any} [data]
 * @param {{transfer?: any[], signal?: AbortSignal}} [options]
 * @returns {Promise<any>}
 */
export async function run(fn, data, options) {
    const worker = await spawn(fn);
    try {
        return await worker.call(data, options);
    } finally {
        await worker.terminate();
    }
}

// Jobs dispatched per worker before its previous reply lands. Depth 2 keeps a
// message in flight while one executes, hiding round-trip latency on sub-ms
// jobs without starving fair distribution on long ones.
const PIPELINE_DEPTH = 2;

/**
 * A fixed pool of workers bound to one function, with an idle-dispatch queue.
 * Submit work with `call()`; the least-loaded worker picks it up (up to
 * {@link PIPELINE_DEPTH} jobs in flight per worker).
 *
 * Break-even: a pool pays one message round trip per job, so it loses to a
 * single `spawn`ed worker on trivial (<~0.1ms) jobs and wins ~Nx once jobs
 * cost ~1ms or more.
 */
export class WorkerPool {
    #fn;
    #size;
    /** @type {{client: ReturnType<typeof createClient>, inflight: number}[]} */
    #workers = [];
    /** @type {{data: any, options: any, resolve: Function, reject: Function}[]} */
    #queue = [];
    #head = 0; // index-based FIFO: Array#shift is O(n^2) at depth on V8
    #ready = null;
    #terminated = false;

    /**
     * @param {Function} fn
     * @param {{size?: number}} [options]
     */
    constructor(fn, { size } = {}) {
        this.#fn = fn;
        this.#size = Math.max(1, size ?? hardwareConcurrency());
    }

    /** @returns {number} */
    get size() {
        return this.#size;
    }

    #init() {
        if (!this.#ready) {
            this.#ready = (async () => {
                const src = workerSource(this.#fn);
                const adapters = await Promise.all(
                    Array.from({ length: this.#size }, () => createWorker(src)),
                );
                this.#workers = adapters.map((adapter) => ({ client: createClient(adapter), inflight: 0 }));
            })();
        }
        return this.#ready;
    }

    /**
     * @param {any} [data]
     * @param {{transfer?: any[], signal?: AbortSignal}} [options]
     * @returns {Promise<any>}
     */
    async call(data, options) {
        if (this.#terminated) {
            throw new Error('WorkerPool terminated');
        }
        await this.#init();
        const { promise, resolve, reject } = Promise.withResolvers();
        this.#queue.push({ data, options, resolve, reject });
        this.#pump();
        return promise;
    }

    #take() {
        const job = this.#queue[this.#head];
        this.#queue[this.#head] = undefined;
        this.#head += 1;
        if (this.#head > 1024 && this.#head * 2 > this.#queue.length) {
            this.#queue = this.#queue.slice(this.#head);
            this.#head = 0;
        }
        return job;
    }

    #pump() {
        while (this.#queue.length > this.#head) {
            let best = null;
            for (const entry of this.#workers) {
                if (entry.inflight < PIPELINE_DEPTH && (best === null || entry.inflight < best.inflight)) {
                    best = entry;
                    if (best.inflight === 0) {
                        break;
                    }
                }
            }
            if (best === null) {
                return;
            }
            const job = this.#take();
            best.inflight += 1;
            best.client.call(job.data, job.options).then(job.resolve, job.reject).finally(() => {
                best.inflight -= 1;
                if (!this.#terminated) {
                    this.#pump();
                }
            });
        }
    }

    /** @returns {Promise<void>} */
    async terminate() {
        this.#terminated = true;
        for (let i = this.#head; i < this.#queue.length; i += 1) {
            this.#queue[i].reject(new Error('WorkerPool terminated'));
        }
        this.#queue = [];
        this.#head = 0;
        await Promise.all(this.#workers.map((entry) => entry.client.terminate()));
    }

    async [Symbol.asyncDispose]() {
        await this.terminate();
    }
}

export default { RUNTIME, hardwareConcurrency, spawn, run, WorkerPool };
