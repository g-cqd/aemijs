/**
 * aemijs/bench — a tiny, honest microbenchmark harness.
 *
 * Cross-runtime via `globalThis.performance`. The previous version awaited
 * every iteration and read the clock per call, under-reporting sync throughput
 * by 2-3 orders of magnitude. This one measures the way mitata does:
 *
 *  - each measured function gets a freshly *generated* timing kernel
 *    (`new Function`) so its call site stays monomorphic across cases; under
 *    a strict CSP (no eval) it falls back to closure kernels — numbers remain
 *    valid, just slightly pessimistic on V8;
 *  - sync ops run in auto-calibrated batches (>= 0.5 ms between two
 *    `performance.now()` reads, 4x unrolled) so clock cost vanishes;
 *  - every result lands in a sink (`globalThis.__aemiSink`) to defeat
 *    dead-code elimination;
 *  - per-batch samples produce median / p99 / stddev; ops/s comes from the
 *    median, not the mean.
 *
 * Caveat: measuring many cases in one process exposes them to shared JIT
 * feedback (cross-case pollution). For publication-grade numbers run one case
 * per process or use mitata — see the repo's `bench/` suite.
 */

const { performance } = globalThis;
const now = () => performance.now();

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

/** @returns {boolean} True when `new Function` is allowed (no strict CSP). */
function evalAllowed() {
    try {
        new Function('');
        return true;
    } catch {
        return false;
    }
}
const CAN_EVAL = evalAllowed();

/**
 * @param {number} opsPerBatch
 * @returns {{kernel: Function, ops: number}}
 */
function makeSyncKernel(opsPerBatch) {
    if (opsPerBatch >= 1024 && CAN_EVAL) {
        // M chunks x 256 x unroll4 — small inner trip counts, monomorphic site.
        const M = Math.max(1, Math.round(opsPerBatch / 1024));
        const ops = M * 1024;
        const src = `
            const samples = [];
            let s;
            const endAt = $now() + budgetMs;
            while ($now() < endAt) {
                const t0 = $now();
                for (let m = 0; m < ${M}; m += 1) {
                    for (let o = 0; o < 256; o += 1) { s = $fn(); s = $fn(); s = $fn(); s = $fn(); }
                }
                const t1 = $now();
                G.__aemiSink = s;
                samples.push((t1 - t0) * 1e6 / ${ops});
            }
            return samples;`;
        return { kernel: new Function('$fn', '$now', 'G', 'budgetMs', src), ops };
    }
    const k = Math.max(1, opsPerBatch);
    if (CAN_EVAL) {
        const src = `
            const samples = [];
            let s;
            const endAt = $now() + budgetMs;
            while ($now() < endAt) {
                const t0 = $now();
                for (let o = 0; o < ${k}; o += 1) s = $fn();
                const t1 = $now();
                G.__aemiSink = s;
                samples.push((t1 - t0) * 1e6 / ${k});
            }
            return samples;`;
        return { kernel: new Function('$fn', '$now', 'G', 'budgetMs', src), ops: k };
    }
    // CSP fallback: shared closure kernel (call site may go polymorphic).
    return {
        ops: k,
        kernel: ($fn, $now, G, budgetMs) => {
            const samples = [];
            let s;
            const endAt = $now() + budgetMs;
            while ($now() < endAt) {
                const t0 = $now();
                for (let o = 0; o < k; o += 1) {
                    s = $fn();
                }
                const t1 = $now();
                G.__aemiSink = s;
                samples.push(((t1 - t0) * 1e6) / k);
            }
            return samples;
        },
    };
}

/**
 * @param {number} k
 * @returns {{kernel: Function, ops: number}}
 */
function makeAsyncKernel(k) {
    if (CAN_EVAL) {
        const src = `
            const samples = [];
            let s;
            const endAt = $now() + budgetMs;
            while ($now() < endAt) {
                const t0 = $now();
                for (let o = 0; o < ${k}; o += 1) s = await $fn();
                const t1 = $now();
                G.__aemiSink = s;
                samples.push((t1 - t0) * 1e6 / ${k});
            }
            return samples;`;
        return { kernel: new AsyncFunction('$fn', '$now', 'G', 'budgetMs', src), ops: k };
    }
    return {
        ops: k,
        kernel: async ($fn, $now, G, budgetMs) => {
            const samples = [];
            let s;
            const endAt = $now() + budgetMs;
            while ($now() < endAt) {
                const t0 = $now();
                for (let o = 0; o < k; o += 1) {
                    s = await $fn();
                }
                const t1 = $now();
                G.__aemiSink = s;
                samples.push(((t1 - t0) * 1e6) / k);
            }
            return samples;
        },
    };
}

/**
 * @typedef {object} BenchResult
 * @property {string} name
 * @property {number} opsPerSec - From the median sample.
 * @property {number} nsPerOp - Median ns per operation (= p50).
 * @property {number} p50 - Median ns/op.
 * @property {number} p99 - 99th-percentile ns/op.
 * @property {number} stddev - Std deviation of per-batch ns/op samples.
 * @property {number} mean - Mean ns/op.
 * @property {number} samples - Number of timed batches.
 * @property {number} batchSize - Operations per batch.
 * @property {number} iterations - Total operations executed.
 * @property {number} elapsedMs - Total measured time.
 */

/**
 * Measure a single function over a time budget.
 * @param {() => any} fn - Sync or async; async-ness is detected once via a probe call.
 * @param {{duration?: number, targetBatchMs?: number}} [options]
 * @returns {Promise<BenchResult>}
 */
export async function measure(fn, { duration = 1000, targetBatchMs = 0.5 } = {}) {
    const probe = fn();
    const isAsync = probe != null && typeof probe.then === 'function';
    globalThis.__aemiSink = isAsync ? await probe : probe;

    // Estimate per-op cost with doubling untimed probes (doubles as warmup).
    let perOpMs;
    {
        let k = 1;
        for (;;) {
            const t0 = now();
            if (isAsync) {
                for (let i = 0; i < k; i += 1) {
                    globalThis.__aemiSink = await fn();
                }
            } else {
                for (let i = 0; i < k; i += 1) {
                    globalThis.__aemiSink = fn();
                }
            }
            const dt = now() - t0;
            if (dt >= targetBatchMs || k >= 1 << 22) {
                perOpMs = dt / k;
                break;
            }
            k <<= 1;
        }
    }

    const opsTarget = Math.max(1, Math.round(targetBatchMs / perOpMs));
    const { kernel, ops } = isAsync ? makeAsyncKernel(opsTarget) : makeSyncKernel(opsTarget);

    const samples = await kernel(fn, now, globalThis, duration);
    samples.sort((a, b) => a - b);
    const n = samples.length;
    const mean = samples.reduce((a, b) => a + b, 0) / n;
    const stddev = Math.sqrt(samples.reduce((a, b) => a + (b - mean) ** 2, 0) / n);
    const q = (p) => samples[Math.min(n - 1, Math.floor(p * n))];
    const p50 = q(0.5);
    return {
        name: fn.name || 'anonymous',
        opsPerSec: 1e9 / p50,
        nsPerOp: p50,
        p50,
        p99: q(0.99),
        stddev,
        mean,
        samples: n,
        batchSize: ops,
        iterations: n * ops,
        elapsedMs: (mean * n * ops) / 1e6,
    };
}

/**
 * A small suite that races several named functions and reports ops/sec,
 * fastest first. See the module caveat about cross-case JIT pollution.
 */
export class Benchmark {
    #cases = [];

    /**
     * @param {string} name
     * @param {() => any} fn
     * @returns {this}
     */
    add(name, fn) {
        this.#cases.push({ name, fn });
        return this;
    }

    /**
     * @param {{duration?: number, targetBatchMs?: number}} [options]
     * @returns {Promise<BenchResult[]>}
     */
    async run(options) {
        const results = [];
        for (const { name, fn } of this.#cases) {
            const result = await measure(fn, options);
            result.name = name;
            results.push(result);
            await new Promise((resolve) => setTimeout(resolve, 0));
        }
        return results.sort((a, b) => b.opsPerSec - a.opsPerSec);
    }

    /**
     * Run and pretty-print a ranked table.
     * @param {{duration?: number, targetBatchMs?: number}} [options]
     * @returns {Promise<BenchResult[]>}
     */
    async table(options) {
        const results = await this.run(options);
        console.table(results.map((r) => ({
            name: r.name,
            'ops/sec': Math.round(r.opsPerSec).toLocaleString(),
            'ns/op (p50)': r.p50 >= 100 ? Math.round(r.p50) : Number(r.p50.toFixed(2)),
            p99: r.p99 >= 100 ? Math.round(r.p99) : Number(r.p99.toFixed(2)),
            '±%': Number(((r.stddev / r.mean) * 100).toFixed(1)),
            batches: r.samples,
        })));
        return results;
    }
}

export default { measure, Benchmark };
