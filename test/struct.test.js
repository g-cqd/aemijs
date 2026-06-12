import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Deque, MinHeap, LRU } from '../src/core/struct.js';
import { mulberry32, randInt } from '../src/core/rand.js';

test('Deque basic FIFO/LIFO operations and growth', () => {
    const d = new Deque(2);
    for (let i = 0; i < 100; i += 1) {
        d.push(i);
    }
    assert.equal(d.size, 100);
    assert.equal(d.peek(), 0);
    assert.equal(d.shift(), 0);
    assert.equal(d.pop(), 99);
    d.unshift(-1);
    assert.equal(d.peek(), -1);
    assert.deepEqual([...d].slice(0, 3), [-1, 1, 2]);
});

test('Deque empty-state returns undefined', () => {
    const d = new Deque();
    assert.equal(d.shift(), undefined);
    assert.equal(d.pop(), undefined);
    assert.equal(d.peek(), undefined);
    assert.equal(d.size, 0);
});

test('Deque fuzz: 10k mixed ops agree with an Array model', () => {
    const rng = mulberry32(99);
    const deque = new Deque();
    const model = [];
    for (let i = 0; i < 10000; i += 1) {
        switch (randInt(0, 3, rng)) {
            case 0: { deque.push(i); model.push(i); break; }
            case 1: { deque.unshift(i); model.unshift(i); break; }
            case 2: { assert.equal(deque.shift(), model.shift()); break; }
            default: { assert.equal(deque.pop(), model.pop()); }
        }
        assert.equal(deque.size, model.length);
    }
    assert.deepEqual([...deque], model);
});

test('MinHeap drains in sorted order', () => {
    const rng = mulberry32(7);
    const values = Array.from({ length: 1000 }, () => rng.u32());
    const heap = new MinHeap();
    for (const v of values) {
        heap.push(v);
    }
    const drained = [];
    while (heap.size > 0) {
        drained.push(heap.pop());
    }
    assert.deepEqual(drained, values.toSorted((a, b) => a - b));
});

test('MinHeap honors a custom comparator and empty pop', () => {
    const heap = new MinHeap((a, b) => b.priority - a.priority); // max-heap via inversion
    heap.push({ priority: 1 });
    heap.push({ priority: 9 });
    heap.push({ priority: 5 });
    assert.equal(heap.peek().priority, 9);
    assert.equal(heap.pop().priority, 9);
    assert.equal(heap.pop().priority, 5);
    assert.equal(heap.pop().priority, 1);
    assert.equal(heap.pop(), undefined);
});

test('LRU evicts least-recently-used and get() refreshes recency', () => {
    const lru = new LRU(3);
    lru.set('a', 1).set('b', 2).set('c', 3);
    assert.equal(lru.get('a'), 1); // refresh: a is now most-recent
    lru.set('d', 4); // evicts b
    assert.equal(lru.has('b'), false);
    assert.deepEqual([...lru].map(([k]) => k), ['c', 'a', 'd']);
});

test('LRU has() does not refresh recency; delete/clear work', () => {
    const lru = new LRU(2);
    lru.set('a', 1).set('b', 2);
    lru.has('a'); // must NOT refresh
    lru.set('c', 3); // evicts a
    assert.equal(lru.get('a'), undefined);
    assert.equal(lru.delete('b'), true);
    lru.clear();
    assert.equal(lru.size, 0);
    lru.set('x', 1);
    assert.equal(lru.get('x'), 1);
});

test('LRU stores undefined-adjacent values and rejects bad capacity', () => {
    const lru = new LRU(2);
    lru.set('n', null).set('z', 0);
    assert.equal(lru.get('n'), null);
    assert.equal(lru.get('z'), 0);
    assert.throws(() => new LRU(0), RangeError);
});

test('LRU fuzz: 50k ops agree with a reference model', () => {
    // Reference: same semantics, eviction via a fresh keys() iterator (slow but
    // unambiguous). The shipped LRU uses a persistent iterator — outputs must
    // be identical.
    class Model {
        constructor(cap) { this.cap = cap; this.m = new Map(); }
        get(k) {
            if (!this.m.has(k)) { return undefined; }
            const v = this.m.get(k);
            this.m.delete(k);
            this.m.set(k, v);
            return v;
        }
        set(k, v) {
            if (!this.m.delete(k) && this.m.size === this.cap) {
                this.m.delete(this.m.keys().next().value);
            }
            this.m.set(k, v);
        }
    }
    const rng = mulberry32(5);
    const lru = new LRU(100);
    const model = new Model(100);
    for (let i = 0; i < 50000; i += 1) {
        const k = rng.u32() % 300;
        if (rng.u32() % 2) {
            lru.set(k, k * 2);
            model.set(k, k * 2);
        } else {
            assert.equal(lru.get(k), model.get(k), `op ${i} key ${k}`);
        }
    }
    assert.equal(lru.size, model.m.size);
});
