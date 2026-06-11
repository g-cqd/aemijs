/**
 * aemijs/bench — a tiny, honest microbenchmark helper.
 *
 * Cross-runtime via `globalThis.performance`. Time-boxed with a warmup pass and
 * a yield between cases (so it never freezes the thread the way the old 5-second
 * blocking loop did), and it only `await`s functions that actually return a
 * promise. For rigorous work prefer mitata/tinybench/Deno.bench — this is for
 * quick, indicative comparisons.
 */

const { performance } = globalThis;

/**
 * @param {() => any} fn
 * @returns {Promise<void>|void}
 */
function invoke(fn) {
    const result = fn();
    if (result && typeof result.then === 'function') {
        return result;
    }
    return undefined;
}

/**
 * @typedef {object} BenchResult
 * @property {string} name
 * @property {number} iterations
 * @property {number} elapsedMs
 * @property {number} opsPerSec
 * @property {number} nsPerOp
 */

/**
 * Measure a single function over a fixed time budget.
 * @param {() => any} fn
 * @param {{duration?: number, warmup?: number}} [options]
 * @returns {Promise<BenchResult>}
 */
export async function measure(fn, { duration = 1000, warmup = 50 } = {}) {
    for (let i = 0; i < warmup; i += 1) {
        await invoke(fn);
    }
    let iterations = 0;
    const start = performance.now();
    let now = start;
    while (now - start < duration) {
        await invoke(fn);
        iterations += 1;
        now = performance.now();
    }
    const elapsedMs = now - start;
    return {
        name: fn.name || 'anonymous',
        iterations,
        elapsedMs,
        opsPerSec: iterations / (elapsedMs / 1000),
        nsPerOp: (elapsedMs * 1e6) / iterations,
    };
}

/**
 * A small suite that races several named functions and reports ops/sec,
 * fastest first.
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
     * @param {{duration?: number, warmup?: number}} [options]
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
     * @param {{duration?: number, warmup?: number}} [options]
     * @returns {Promise<BenchResult[]>}
     */
    async table(options) {
        const results = await this.run(options);
        console.table(results.map((r) => ({
            name: r.name,
            'ops/sec': Math.round(r.opsPerSec).toLocaleString(),
            'ns/op': Math.round(r.nsPerOp),
            iterations: r.iterations,
        })));
        return results;
    }
}

export default { measure, Benchmark };
