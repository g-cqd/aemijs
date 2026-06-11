/**
 * aemijs/math — the bits the platform still lacks.
 *
 * `Easing`: Robert Penner's timing functions in the classic 4-arg form
 *   (t = elapsed time, b = begin value, c = change in value, d = duration),
 *   useful for canvas/WebGL/JS-driven animation where CSS easing can't reach.
 * `div`/`fact`/`fib`: arbitrary-precision BigInt helpers with no native
 *   equivalent. (`mul`/`pow` were dropped — they were just `*` and `**`.)
 */

/** @typedef {(t: number, b: number, c: number, d: number) => number} EasingFn */

/** @type {Record<string, EasingFn>} */
export const Easing = {
    linearTween: (t, b, c, d) => c * t / d + b,

    easeInQuad: (t, b, c, d) => { t /= d; return c * t * t + b; },
    easeOutQuad: (t, b, c, d) => { t /= d; return -c * t * (t - 2) + b; },
    easeInOutQuad: (t, b, c, d) => {
        t /= d / 2;
        if (t < 1) { return c / 2 * t * t + b; }
        t -= 1;
        return -c / 2 * (t * (t - 2) - 1) + b;
    },

    easeInCubic: (t, b, c, d) => { t /= d; return c * t * t * t + b; },
    easeOutCubic: (t, b, c, d) => { t /= d; t -= 1; return c * (t * t * t + 1) + b; },
    easeInOutCubic: (t, b, c, d) => {
        t /= d / 2;
        if (t < 1) { return c / 2 * t * t * t + b; }
        t -= 2;
        return c / 2 * (t * t * t + 2) + b;
    },

    easeInQuart: (t, b, c, d) => { t /= d; return c * t * t * t * t + b; },
    easeOutQuart: (t, b, c, d) => { t /= d; t -= 1; return -c * (t * t * t * t - 1) + b; },
    easeInOutQuart: (t, b, c, d) => {
        t /= d / 2;
        if (t < 1) { return c / 2 * t * t * t * t + b; }
        t -= 2;
        return -c / 2 * (t * t * t * t - 2) + b;
    },

    easeInQuint: (t, b, c, d) => { t /= d; return c * t * t * t * t * t + b; },
    easeOutQuint: (t, b, c, d) => { t /= d; t -= 1; return c * (t * t * t * t * t + 1) + b; },
    easeInOutQuint: (t, b, c, d) => {
        t /= d / 2;
        if (t < 1) { return c / 2 * t * t * t * t * t + b; }
        t -= 2;
        return c / 2 * (t * t * t * t * t + 2) + b;
    },

    easeInSine: (t, b, c, d) => -c * Math.cos(t / d * (Math.PI / 2)) + c + b,
    easeOutSine: (t, b, c, d) => c * Math.sin(t / d * (Math.PI / 2)) + b,
    easeInOutSine: (t, b, c, d) => -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b,

    // Exponential easings are guarded at the endpoints: without these checks
    // easeInExpo(0) returns b + c·2⁻¹⁰ instead of exactly b (the Penner wart).
    easeInExpo: (t, b, c, d) => (t === 0 ? b : c * 2 ** (10 * (t / d - 1)) + b),
    easeOutExpo: (t, b, c, d) => (t === d ? b + c : c * (-(2 ** (-10 * t / d)) + 1) + b),
    easeInOutExpo: (t, b, c, d) => {
        if (t === 0) { return b; }
        if (t === d) { return b + c; }
        t /= d / 2;
        if (t < 1) { return c / 2 * 2 ** (10 * (t - 1)) + b; }
        t -= 1;
        return c / 2 * (-(2 ** (-10 * t)) + 2) + b;
    },

    easeInCirc: (t, b, c, d) => { t /= d; return -c * (Math.sqrt(1 - t * t) - 1) + b; },
    easeOutCirc: (t, b, c, d) => { t /= d; t -= 1; return c * Math.sqrt(1 - t * t) + b; },
    easeInOutCirc: (t, b, c, d) => {
        t /= d / 2;
        if (t < 1) { return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b; }
        t -= 2;
        return c / 2 * (Math.sqrt(1 - t * t) + 1) + b;
    },
};

/**
 * @typedef {object} BigFloat
 * @property {bigint} integer - Signed integer part.
 * @property {number[]} decimal - Decimal digits (0-9), most significant first.
 * @property {boolean} negative - True when the value is negative.
 * @property {() => string} toString
 */

/**
 * Long-divide two integers to an arbitrary number of decimal digits, exactly.
 * @param {number|bigint} dividend
 * @param {number|bigint} divisor
 * @param {number} [accuracy=100] - Maximum number of decimal digits to compute.
 * @returns {BigFloat}
 * @throws {RangeError} When `divisor` is zero.
 * @example div(1, 3, 10).toString() // => "0.3333333333"
 */
export function div(dividend, divisor, accuracy = 100) {
    const a = BigInt(dividend);
    const b = BigInt(divisor);
    if (b === 0n) {
        throw new RangeError('Division by zero');
    }
    const negative = (a < 0n) !== (b < 0n);
    const absA = a < 0n ? -a : a;
    const absB = b < 0n ? -b : b;

    const whole = absA / absB;
    const decimal = [];
    let remainder = (absA - whole * absB) * 10n;
    let left = accuracy;
    while (remainder !== 0n && left > 0) {
        const q = remainder / absB;
        decimal.push(Number(q));
        remainder = (remainder - q * absB) * 10n;
        left -= 1;
    }

    return {
        integer: negative ? -whole : whole,
        decimal,
        negative,
        toString() {
            const body = decimal.length > 0 ? `${whole}.${decimal.join('')}` : `${whole}`;
            return negative && (whole !== 0n || decimal.length > 0) ? `-${body}` : body;
        },
    };
}

/**
 * Factorial of a non-negative integer, exactly (BigInt).
 * @param {number|bigint} target
 * @returns {bigint}
 * @throws {RangeError} When `target` is negative.
 */
export function fact(target) {
    const n = BigInt(target);
    if (n < 0n) {
        throw new RangeError('fact expects a non-negative integer');
    }
    let result = 1n;
    for (let i = 2n; i <= n; i += 1n) {
        result *= i;
    }
    return result;
}

/**
 * The `index`-th Fibonacci number (0-indexed: 0, 1, 1, 2, 3, 5, …), exactly.
 * @param {number} index
 * @returns {bigint}
 * @throws {RangeError} When `index` is negative or not an integer.
 */
export function fib(index) {
    const n = Number(index);
    if (!Number.isInteger(n) || n < 0) {
        throw new RangeError('fib expects a non-negative integer');
    }
    let a = 0n;
    let b = 1n;
    for (let i = 0; i < n; i += 1) {
        [a, b] = [b, a + b];
    }
    return a;
}

export default { Easing, div, fact, fib };
