import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pipe, compose, pipeAsync, composeAsync, identity, tap } from '../src/core/fp.js';

const double = (n) => n * 2;
const increment = (n) => n + 1;

test('pipe runs left-to-right and threads the first call args', () => {
    assert.equal(pipe(double, increment)(20), 41);
    assert.equal(pipe((a, b) => a + b, double)(3, 4), 14);
});

test('compose runs right-to-left', () => {
    assert.equal(compose(double, increment)(20), 42);
});

test('empty pipe/compose is identity on the first argument', () => {
    assert.equal(pipe()(7), 7);
    assert.equal(compose()(7), 7);
});

test('pipe and compose do not mutate input through reuse', () => {
    const p = pipe(double, increment);
    assert.equal(p(1), 3);
    assert.equal(p(1), 3);
});

test('pipeAsync awaits each step', async () => {
    const asyncDouble = async (n) => n * 2;
    assert.equal(await pipeAsync(asyncDouble, increment)(20), 41);
    assert.equal(await composeAsync(asyncDouble, increment)(20), 42);
});

test('non-functions are rejected', () => {
    assert.throws(() => pipe(double, 42), TypeError);
});

test('identity returns its argument', () => {
    const obj = {};
    assert.equal(identity(obj), obj);
});

test('tap performs a side effect and passes the value through', () => {
    let seen = null;
    const result = pipe(double, tap((v) => { seen = v; }), increment)(10);
    assert.equal(seen, 20);
    assert.equal(result, 21);
});
