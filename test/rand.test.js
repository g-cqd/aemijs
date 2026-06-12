import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitmix32, mulberry32, xoshiro128ss, randInt, shuffle } from '../src/core/rand.js';

test('generators are deterministic (exact first-5 u32 outputs for seed 42)', () => {
    const expected = {
        splitmix32: [551831576, 144025891, 322543647, 3034809370, 908029994],
        mulberry32: [2581720956, 1925393290, 3661312704, 2876485805, 750819978],
        xoshiro128ss: [660444221, 3652823732, 77672526, 910233633, 2297337756],
    };
    for (const [name, mk] of [['splitmix32', splitmix32], ['mulberry32', mulberry32], ['xoshiro128ss', xoshiro128ss]]) {
        const rng = mk(42);
        const got = [rng.u32(), rng.u32(), rng.u32(), rng.u32(), rng.u32()];
        assert.deepEqual(got, expected[name], name);
    }
});

test('same seed yields the same sequence; different seeds diverge', () => {
    const a = splitmix32(7);
    const b = splitmix32(7);
    const c = splitmix32(8);
    const seqA = Array.from({ length: 10 }, () => a.u32());
    const seqB = Array.from({ length: 10 }, () => b.u32());
    const seqC = Array.from({ length: 10 }, () => c.u32());
    assert.deepEqual(seqA, seqB);
    assert.notDeepEqual(seqA, seqC);
});

test('float output is in [0, 1)', () => {
    for (const mk of [splitmix32, mulberry32, xoshiro128ss]) {
        const rng = mk(123);
        for (let i = 0; i < 1000; i += 1) {
            const x = rng();
            assert.ok(x >= 0 && x < 1);
        }
    }
});

test('randInt stays in bounds and covers the range roughly uniformly', () => {
    const rng = splitmix32(2026);
    const buckets = new Array(6).fill(0);
    const draws = 60000;
    for (let i = 0; i < draws; i += 1) {
        const v = randInt(1, 6, rng);
        assert.ok(v >= 1 && v <= 6);
        buckets[v - 1] += 1;
    }
    const expected = draws / 6;
    for (const count of buckets) {
        assert.ok(Math.abs(count - expected) < expected * 0.1, `bucket ${count} vs ${expected}`);
    }
});

test('shuffle returns a permutation, does not mutate, and is seed-deterministic', () => {
    const input = Array.from({ length: 100 }, (_, i) => i);
    const snapshot = [...input];
    const out = shuffle(input, splitmix32(5));
    assert.deepEqual(input, snapshot, 'input untouched');
    assert.deepEqual([...out].sort((a, b) => a - b), snapshot, 'is a permutation');
    assert.notDeepEqual(out, snapshot, 'order changed (astronomically unlikely otherwise)');
    assert.deepEqual(out, shuffle(snapshot, splitmix32(5)), 'same seed, same order');
});
