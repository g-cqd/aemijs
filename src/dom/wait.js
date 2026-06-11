/**
 * aemijs/dom — Wait: document-lifecycle and timing as promises.
 *
 * The 2021 version kept a global array of callbacks, re-ran all of them on
 * every `readystatechange`, never removed listeners, and `Wait.load` actually
 * waited on `complete` (not the window `load` event). This version is just a
 * handful of self-contained, leak-free promises.
 */

const READY_ORDER = { loading: 0, interactive: 1, complete: 2 };

/** @returns {Document} */
function doc() {
    const d = globalThis.document;
    if (!d) {
        throw new Error('Wait requires a DOM (document is undefined)');
    }
    return d;
}

/**
 * Resolve once `document.readyState` reaches (or has passed) `target`.
 * @param {'interactive'|'complete'} target
 * @returns {Promise<void>}
 */
function whenReadyState(target) {
    const d = doc();
    if (READY_ORDER[d.readyState] >= READY_ORDER[target]) {
        return Promise.resolve();
    }
    return new Promise((resolve) => {
        const onChange = () => {
            if (READY_ORDER[d.readyState] >= READY_ORDER[target]) {
                d.removeEventListener('readystatechange', onChange);
                resolve();
            }
        };
        d.addEventListener('readystatechange', onChange);
    });
}

/**
 * @param {Function} [fn]
 * @param {any[]} args
 * @returns {any}
 */
function call(fn, args) {
    return typeof fn === 'function' ? fn(...args) : undefined;
}

export const Wait = {
    /**
     * Resolve when the DOM is parsed (readyState `interactive`), running an
     * optional callback and resolving with its result.
     * @param {Function} [fn]
     * @param {...any} args
     * @returns {Promise<any>}
     */
    async interactive(fn, ...args) {
        await whenReadyState('interactive');
        return call(fn, args);
    },

    /**
     * Alias of {@link Wait.interactive} — `DOMContentLoaded` corresponds to the
     * `interactive` ready state.
     * @param {Function} [fn]
     * @param {...any} args
     * @returns {Promise<any>}
     */
    DOMContentLoaded(fn, ...args) {
        return this.interactive(fn, ...args);
    },

    /**
     * Resolve when the document is fully parsed (readyState `complete`).
     * @param {Function} [fn]
     * @param {...any} args
     * @returns {Promise<any>}
     */
    async complete(fn, ...args) {
        await whenReadyState('complete');
        return call(fn, args);
    },

    /**
     * Alias of {@link Wait.complete}.
     * @param {Function} [fn]
     * @param {...any} args
     * @returns {Promise<any>}
     */
    ready(fn, ...args) {
        return this.complete(fn, ...args);
    },

    /**
     * Resolve on the window `load` event (after all subresources load) — the
     * bug-for-bug fix of the old `Wait.load`, which waited on `complete`.
     * @param {Function} [fn]
     * @param {...any} args
     * @returns {Promise<any>}
     */
    load(fn, ...args) {
        const d = doc();
        if (d.readyState === 'complete') {
            return Promise.resolve(call(fn, args));
        }
        return new Promise((resolve) => {
            globalThis.addEventListener('load', () => resolve(call(fn, args)), { once: true });
        });
    },

    /**
     * Wait `ms` milliseconds. Uses the `scheduler.wait` API when available and
     * supports cancellation via an `AbortSignal`.
     * @param {number} ms
     * @param {{signal?: AbortSignal}} [options]
     * @returns {Promise<void>}
     */
    time(ms, options = {}) {
        if (globalThis.scheduler?.wait) {
            return globalThis.scheduler.wait(ms, options);
        }
        const { signal } = options;
        return new Promise((resolve, reject) => {
            if (signal?.aborted) {
                reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
                return;
            }
            const id = setTimeout(resolve, ms);
            signal?.addEventListener('abort', () => {
                clearTimeout(id);
                reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
            }, { once: true });
        });
    },

    /**
     * Run a (possibly throwing, possibly sync) function and capture the outcome
     * as a promise. Uses `Promise.try` when available.
     * @param {Function} fn
     * @param {...any} args
     * @returns {Promise<any>}
     */
    async(fn, ...args) {
        if (typeof Promise.try === 'function') {
            return Promise.try(fn, ...args);
        }
        return new Promise((resolve) => resolve(fn(...args)));
    },
};

export default { Wait };
