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

test('fib fast-doubling matches known large values', () => {
    assert.equal(fib(90), 2880067194370816120n);
    const f1000 = fib(1000).toString();
    assert.equal(f1000.length, 209);
    assert.ok(f1000.startsWith('43466557686937456435'));
    assert.ok(f1000.endsWith('76137795166849228875'));
    assert.throws(() => fib(2 ** 31), RangeError);
});

test('fact binary-split matches the canonical 100!', () => {
    const f100 = fact(100).toString();
    assert.equal(f100.length, 158);
    assert.ok(f100.startsWith('93326215443944152681'));
    assert.equal(fact(8), 40320n, 'leaf-threshold boundary');
    assert.equal(fact(9), 362880n, 'first split');
});

test('div chunked digits: strip-then-cut rule and repeating expansions', () => {
    assert.equal(div(1, 100000, 3).toString(), '0.000', 'truncated terminating expansion keeps significant zeros');
    assert.equal(div(1, 100000, 10).toString(), '0.00001', 'full terminating expansion strips pad zeros');
    assert.equal(div(22, 7, 30).toString(), '3.142857142857142857142857142857');
    assert.equal(typeof div(1, 3, 5).decimal, 'string');
    assert.equal(div(1, 3, 5).decimal, '33333');
});
