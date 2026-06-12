/** RNG vs Math.random; Deque vs denque vs Array; LRU vs lru-cache; MinHeap; memoize. */

import { bench, run, do_not_optimize } from 'mitata';
import Denque from 'denque';
import { LRUCache } from 'lru-cache';
import { splitmix32, mulberry32, xoshiro128ss } from '../src/core/rand.js';
import { Deque, MinHeap, LRU } from '../src/core/struct.js';
import { memoize } from '../src/core/fp.js';

// --- RNG ---------------------------------------------------------------------
const sm = splitmix32(1);
const mb = mulberry32(1);
const xs = xoshiro128ss(1);
bench('Math.random', () => do_not_optimize(Math.random()));
bench('splitmix32', () => do_not_optimize(sm()));
bench('mulberry32', () => do_not_optimize(mb()));
bench('xoshiro128**', () => do_not_optimize(xs()));

// --- FIFO queues: interleaved at depth 512, 100k ops --------------------------
const fifo = (q, push, shift) => {
    for (let i = 0; i < 512; i += 1) {
        push(q, i);
    }
    for (let i = 0; i < 100000; i += 1) {
        push(q, i);
        do_not_optimize(shift(q));
    }
    while (true) {
        const v = shift(q);
        if (v === undefined) {
            break;
        }
    }
};
bench('Deque (aemijs)   FIFO 100k @512', () => fifo(new Deque(), (q, v) => q.push(v), (q) => q.shift()));
bench('denque           FIFO 100k @512', () => fifo(new Denque(), (q, v) => q.push(v), (q) => q.shift()));
bench('Array#shift      FIFO 100k @512', () => fifo([], (q, v) => q.push(v), (q) => q.shift()));

// --- Array#shift cliff: fill 20k then drain (V8 goes quadratic) --------------
const drain = (q, push, shift) => {
    for (let i = 0; i < 20000; i += 1) {
        push(q, i);
    }
    for (let i = 0; i < 20000; i += 1) {
        do_not_optimize(shift(q));
    }
};
bench('Deque   fill+drain 20k', () => drain(new Deque(), (q, v) => q.push(v), (q) => q.shift()));
bench('Array   fill+drain 20k', () => drain([], (q, v) => q.push(v), (q) => q.shift()));

// --- LRU @10k cap, 100k ops, ~90% hit ratio -----------------------------------
const CAP = 10000;
const OPS = 100000;
const r = mulberry32(2024);
const keys = new Array(OPS);
const isSet = new Array(OPS);
for (let i = 0; i < OPS; i += 1) {
    keys[i] = r.u32() % 100 < 90 ? r.u32() % (CAP - 1000) : CAP + (r.u32() % 1e6);
    isSet[i] = r.u32() % 100 < 10;
}
const lruWorkload = (cache) => {
    let hits = 0;
    for (let i = 0; i < OPS; i += 1) {
        const k = keys[i];
        if (isSet[i]) {
            cache.set(k, k);
        } else if (cache.get(k) !== undefined) {
            hits += 1;
        } else {
            cache.set(k, k);
        }
    }
    return hits;
};
bench('LRU (aemijs)    100k ops @10k', function* () {
    yield () => {
        const c = new LRU(CAP);
        for (let i = 0; i < CAP; i += 1) {
            c.set(i, i);
        }
        do_not_optimize(lruWorkload(c));
    };
});
bench('lru-cache (pkg) 100k ops @10k', function* () {
    yield () => {
        const c = new LRUCache({ max: CAP });
        for (let i = 0; i < CAP; i += 1) {
            c.set(i, i);
        }
        do_not_optimize(lruWorkload(c));
    };
});

// --- MinHeap vs sorted-array priority queue, 10k push+pop ----------------------
const values = Array.from({ length: 10000 }, () => mulberry32(7).u32());
bench('MinHeap 10k push+pop', () => {
    const h = new MinHeap();
    for (const v of values) {
        h.push(v);
    }
    while (h.size > 0) {
        do_not_optimize(h.pop());
    }
});
bench('sorted-array 10k insert+shift', () => {
    const a = [];
    for (const v of values) {
        let lo = 0;
        let hi = a.length;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (a[mid] < v) {
                lo = mid + 1;
            } else {
                hi = mid;
            }
        }
        a.splice(lo, 0, v);
    }
    while (a.length > 0) {
        do_not_optimize(a.shift());
    }
});

// --- memoize hit path ----------------------------------------------------------
const slowFn = (n) => {
    let s = 0;
    for (let i = 0; i < 2000; i += 1) {
        s += i * n;
    }
    return s;
};
const memo = memoize(slowFn);
memo(7);
bench('direct call (2k-loop fn)', () => do_not_optimize(slowFn(7)));
bench('memoize hit', () => do_not_optimize(memo(7)));

await run();
