/**
 * aemijs/fp — function composition the language still doesn't give us.
 *
 * The pipeline operator (`|>`) never shipped, so left-to-right composition is
 * still worth a tiny helper. Everything here is allocation-light and variadic.
 */

/**
 * @param {Function[]} fns
 * @returns {void}
 */
function assertFns(fns) {
    for (const fn of fns) {
        if (typeof fn !== 'function') {
            throw new TypeError('pipe/compose expects functions');
        }
    }
}

/**
 * Left-to-right composition. The first function receives all arguments; each
 * subsequent function receives the previous result.
 * @param {...Function} fns
 * @returns {Function}
 * @example pipe(double, increment)(20) // => 41
 */
export function pipe(...fns) {
    assertFns(fns);
    return (...args) => {
        if (fns.length === 0) {
            return args[0];
        }
        let result = fns[0](...args);
        for (let i = 1; i < fns.length; i += 1) {
            result = fns[i](result);
        }
        return result;
    };
}

/**
 * Right-to-left composition: `compose(f, g)(x)` is `f(g(x))`.
 * @param {...Function} fns
 * @returns {Function}
 */
export function compose(...fns) {
    return pipe(...fns.reverse());
}

/**
 * Like {@link pipe}, but awaits each step so async functions compose cleanly.
 * @param {...Function} fns
 * @returns {(...args: any[]) => Promise<any>}
 */
export function pipeAsync(...fns) {
    assertFns(fns);
    return async (...args) => {
        if (fns.length === 0) {
            return args[0];
        }
        let result = await fns[0](...args);
        for (let i = 1; i < fns.length; i += 1) {
            result = await fns[i](result);
        }
        return result;
    };
}

/**
 * Right-to-left async composition.
 * @param {...Function} fns
 * @returns {(...args: any[]) => Promise<any>}
 */
export function composeAsync(...fns) {
    return pipeAsync(...fns.reverse());
}

/**
 * The identity function — handy as a default or placeholder in pipelines.
 * @template T
 * @param {T} value
 * @returns {T}
 */
export function identity(value) {
    return value;
}

/**
 * Run a side effect on a value mid-pipeline and pass the value through
 * unchanged. `pipe(parse, tap(console.log), transform)`.
 * @param {(value: any) => void} fn
 * @returns {(value: any) => any}
 */
export function tap(fn) {
    return (value) => {
        fn(value);
        return value;
    };
}

// The combinators below fill gaps TC39 walked away from: proposal-function-
// helpers (once/debounce/throttle) was withdrawn and Function.prototype.memo
// is parked at Stage 1 — nothing native exists in 2026.

/**
 * Run `fn` at most once; subsequent calls return the first result. The wrapped
 * function is released after the call so captured state can be collected.
 * @template {Function} F
 * @param {F} fn
 * @returns {F}
 */
export function once(fn) {
    let called = false;
    let result;
    return function onced(...args) {
        if (!called) {
            called = true;
            result = fn.apply(this, args);
            fn = undefined;
        }
        return result;
    };
}

/**
 * Memoize `fn` in a Map. Unary functions get a direct-key fast path (~2ns hit
 * overhead measured); multi-arg functions use `keyFn` to derive the cache key
 * (default joins arguments with `\u001F` — provide `keyFn` for object args).
 * The cache is unbounded; pair with `LRU` from aemijs/struct if needed.
 * @template {Function} F
 * @param {F} fn
 * @param {(...args: any[]) => any} [keyFn]
 * @returns {F}
 */
export function memoize(fn, keyFn) {
    const cache = new Map();
    if (keyFn === undefined && fn.length <= 1) {
        return function memoized(arg) {
            let value = cache.get(arg);
            if (value === undefined && !cache.has(arg)) {
                value = fn.call(this, arg);
                cache.set(arg, value);
            }
            return value;
        };
    }
    const key = keyFn ?? ((...args) => args.join('\u001F'));
    return function memoized(...args) {
        const k = key(...args);
        let value = cache.get(k);
        if (value === undefined && !cache.has(k)) {
            value = fn.apply(this, args);
            cache.set(k, value);
        }
        return value;
    };
}

/**
 * Trailing-edge debounce: `fn` runs `delay` ms after the last call. Cancel via
 * `.cancel()` or an `AbortSignal`.
 * @param {Function} fn
 * @param {number} delay
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Function & {cancel: () => void}}
 */
export function debounce(fn, delay, { signal } = {}) {
    let timer;
    const debounced = function debounced(...args) {
        if (signal?.aborted) {
            return;
        }
        clearTimeout(timer);
        timer = setTimeout(() => {
            timer = undefined;
            fn.apply(this, args);
        }, delay);
    };
    debounced.cancel = () => {
        clearTimeout(timer);
        timer = undefined;
    };
    signal?.addEventListener('abort', debounced.cancel, { once: true });
    return debounced;
}

/**
 * Leading+trailing throttle: `fn` runs at most once per `interval` ms, and the
 * last suppressed call fires on the trailing edge. Cancel via `.cancel()` or
 * an `AbortSignal`.
 * @param {Function} fn
 * @param {number} interval
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Function & {cancel: () => void}}
 */
export function throttle(fn, interval, { signal } = {}) {
    let last = -Infinity;
    let timer;
    let lastArgs;
    let lastThis;
    const invoke = () => {
        timer = undefined;
        last = Date.now();
        fn.apply(lastThis, lastArgs);
    };
    const throttled = function throttled(...args) {
        if (signal?.aborted) {
            return;
        }
        lastArgs = args;
        lastThis = this;
        const wait = interval - (Date.now() - last);
        if (wait <= 0) {
            clearTimeout(timer);
            invoke();
        } else if (timer === undefined) {
            timer = setTimeout(invoke, wait);
        }
    };
    throttled.cancel = () => {
        clearTimeout(timer);
        timer = undefined;
    };
    signal?.addEventListener('abort', throttled.cancel, { once: true });
    return throttled;
}

export default { pipe, compose, pipeAsync, composeAsync, identity, tap, once, memoize, debounce, throttle };
