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

export default { pipe, compose, pipeAsync, composeAsync, identity, tap };
