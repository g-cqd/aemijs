/** Hashing: pure-JS short-key hashes vs xxhash-wasm (and Bun.hash on Bun). */

import { bench, run, do_not_optimize } from 'mitata';
import xxhashWasm from 'xxhash-wasm';
import { fnv1a, cyrb53, xxh32 } from '../src/core/hash.js';

const { h32, h32Raw } = await xxhashWasm();
const enc = new TextEncoder();

const sizes = [8, 64, 1024, 65536];
const inputs = sizes.map((n) => {
    let s = '';
    while (s.length < n) {
        s += 'abcdefgh';
    }
    s = s.slice(0, n);
    return { n, s, b: enc.encode(s) };
});

for (const { n, s, b } of inputs) {
    const label = n >= 1024 ? `${n / 1024}KB` : `${n}B`;
    bench(`fnv1a (str)      ${label}`, () => do_not_optimize(fnv1a(s)));
    bench(`cyrb53 (str)     ${label}`, () => do_not_optimize(cyrb53(s)));
    bench(`xxh32 (bytes JS) ${label}`, () => do_not_optimize(xxh32(b)));
    bench(`wasm h32 (str)   ${label}`, () => do_not_optimize(h32(s)));
    bench(`wasm h32Raw      ${label}`, () => do_not_optimize(h32Raw(b)));
    if (typeof Bun !== 'undefined') {
        bench(`Bun.hash.xxHash32 ${label}`, () => do_not_optimize(Bun.hash.xxHash32(b)));
    }
}

console.log('expectation (measured): JS wins <=64B on V8 / <=256-512B on JSC;');
console.log('wasm wins >=1KB bulk. These are short-key hashes by design.');
await run();
