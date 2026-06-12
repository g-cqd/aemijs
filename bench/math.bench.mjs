/** BigInt math: shipped algorithms vs the naive forms they replaced. */

import { bench, run, do_not_optimize } from 'mitata';
import { fib, fact, div } from '../src/core/math.js';

function fibNaive(n) {
    let a = 0n, b = 1n;
    for (let i = 0; i < n; i += 1) { [a, b] = [b, a + b]; }
    return a;
}
function factNaive(n) {
    let r = 1n;
    for (let i = 2n; i <= BigInt(n); i += 1n) { r *= i; }
    return r;
}
function divNaive(dividend, divisor, accuracy) {
    const a = BigInt(dividend), b = BigInt(divisor);
    const whole = a / b;
    const digits = [];
    let rem = (a - whole * b) * 10n;
    for (let i = 0; i < accuracy && rem !== 0n; i += 1) {
        const q = rem / b;
        digits.push(Number(q));
        rem = (rem - q * b) * 10n;
    }
    return `${whole}.${digits.join('')}`;
}

bench('fib(1000)  fast-doubling', () => do_not_optimize(fib(1000)));
bench('fib(1000)  naive linear', () => do_not_optimize(fibNaive(1000)));
bench('fib(10000) fast-doubling', () => do_not_optimize(fib(10000)));
bench('fib(10000) naive linear', () => do_not_optimize(fibNaive(10000)));

bench('fact(2000)  binary-split', () => do_not_optimize(fact(2000)));
bench('fact(2000)  naive ascending', () => do_not_optimize(factNaive(2000)));
bench('fact(10000) binary-split', () => do_not_optimize(fact(10000)));
bench('fact(10000) naive ascending', () => do_not_optimize(factNaive(10000)));

bench('div(1,7,1000)  chunked 1e9', () => do_not_optimize(div(1, 7, 1000).toString()));
bench('div(1,7,1000)  naive per-digit', () => do_not_optimize(divNaive(1, 7, 1000)));

console.log('note: WASM is not a contender here — arbitrary precision needs a bignum');
console.log('library; the engine-native BigInt these run on IS the fast path.');
await run();
