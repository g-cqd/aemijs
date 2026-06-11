import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Easing, div, fact, fib } from '../src/core/math.js';

test('easings hit exact endpoints (begin and begin+change)', () => {
    for (const name of Object.keys(Easing)) {
        const fn = Easing[name];
        assert.equal(fn(0, 0, 100, 1000), 0, `${name} at t=0 should equal b`);
        assert.ok(Math.abs(fn(1000, 0, 100, 1000) - 100) < 1e-9, `${name} at t=d should equal b+c`);
    }
});

test('exponential easings are guarded (no 2^-10 wart at the start)', () => {
    assert.equal(Easing.easeInExpo(0, 0, 100, 1000), 0);
    assert.equal(Easing.easeOutExpo(1000, 0, 100, 1000), 100);
    assert.equal(Easing.easeInOutExpo(0, 0, 100, 1000), 0);
    assert.equal(Easing.easeInOutExpo(1000, 0, 100, 1000), 100);
});

test('div computes exact terminating decimals without a duplicated digit', () => {
    assert.equal(div(1, 8).toString(), '0.125');
    assert.equal(div(7, 2).toString(), '3.5');
    assert.equal(div(1, 100).toString(), '0.01');
    assert.equal(div(10, 2).toString(), '5');
});

test('div computes repeating decimals to the requested accuracy', () => {
    assert.equal(div(1, 3, 10).toString(), '0.3333333333');
    assert.equal(div(2, 3, 6).toString(), '0.666666');
});

test('div handles negative operands and zero divisor', () => {
    assert.equal(div(-1, 3, 4).toString(), '-0.3333');
    assert.equal(div(-7, 2).toString(), '-3.5');
    assert.equal(div(7, -2).toString(), '-3.5');
    assert.throws(() => div(1, 0), RangeError);
});

test('fact is exact and rejects negatives', () => {
    assert.equal(fact(0), 1n);
    assert.equal(fact(1), 1n);
    assert.equal(fact(5), 120n);
    assert.equal(fact(21), 51090942171709440000n);
    assert.throws(() => fact(-1), RangeError);
});

test('fib is correct from 0 (the old off-by-one is gone)', () => {
    const expected = [0n, 1n, 1n, 2n, 3n, 5n, 8n, 13n, 21n, 34n, 55n];
    expected.forEach((value, i) => assert.equal(fib(i), value, `fib(${i})`));
    assert.equal(fib(100), 354224848179261915075n);
    assert.throws(() => fib(-1), RangeError);
});
