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
    return {
        postMessage: (m, t) => w.postMessage(m, t && t.length ? t : undefined),
        onMessage: (h) => w.addEventListener('message', (e) => { revoke(); h(e.data); }),
        onError: (h) => {
            const wrap = (e) => { revoke(); h(e instanceof Error ? e : new Error(e?.message || 'Worker error')); };
            w.addEventListener('error', wrap);
            w.addEventListener('messageerror', wrap);
        },
        onClose: () => { /* web workers have no exit event; terminate() is the only close */ },
        terminate: () => { revoke(); return w.terminate(); },
    };
}

/**
 * Wrap an adapter in the request/response RPC layer.
 * @param {Adapter} adapter
 */
function createClient(adapter) {
    /** @type {Map<string, {resolve: Function, reject: Function}>} */
    const pending = new Map();
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
            const id = crypto.randomUUID();
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

/**
 * A fixed pool of workers bound to one function, with an idle-dispatch queue.
 * Submit work with `call()`; the next free worker picks it up. Replaces the old
 * "broadcast to every worker" cluster with a real scheduler.
 */
export class WorkerPool {
    #fn;
    #size;
    #workers = [];
    #idle = [];
    #queue = [];
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
                for (let i = 0; i < this.#size; i += 1) {
                    const client = createClient(await createWorker(src));
                    this.#workers.push(client);
                    this.#idle.push(client);
                }
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

    #pump() {
        while (this.#idle.length > 0 && this.#queue.length > 0) {
            const client = this.#idle.pop();
            const job = this.#queue.shift();
            client.call(job.data, job.options).then(job.resolve, job.reject).finally(() => {
                if (!this.#terminated) {
                    this.#idle.push(client);
                    this.#pump();
                }
            });
        }
    }

    /** @returns {Promise<void>} */
    async terminate() {
        this.#terminated = true;
        for (const job of this.#queue) {
            job.reject(new Error('WorkerPool terminated'));
        }
        this.#queue = [];
        await Promise.all(this.#workers.map((w) => w.terminate()));
    }

    async [Symbol.asyncDispose]() {
        await this.terminate();
    }
}

export default { RUNTIME, hardwareConcurrency, spawn, run, WorkerPool };
