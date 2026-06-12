import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pipe, compose, pipeAsync, composeAsync, identity, tap, once, memoize, debounce, throttle } from '../src/core/fp.js';

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

test('once runs the function a single time and replays the result', () => {
    let calls = 0;
    const init = once((n) => { calls += 1; return n * 2; });
    assert.equal(init(21), 42);
    assert.equal(init(99), 42);
    assert.equal(calls, 1);
});

test('memoize caches by argument, including undefined results', () => {
    let calls = 0;
    const slow = memoize((n) => { calls += 1; return n % 2 === 0 ? n * 10 : undefined; });
    assert.equal(slow(2), 20);
    assert.equal(slow(2), 20);
    assert.equal(slow(3), undefined);
    assert.equal(slow(3), undefined);
    assert.equal(calls, 2, 'undefined results are cached too');
});

test('memoize multi-arg default key distinguishes argument boundaries', () => {
    let calls = 0;
    const join = memoize((a, b) => { calls += 1; return `${a}|${b}`; });
    assert.equal(join('a', 'b'), 'a|b');
    assert.equal(join('ab', undefined), 'ab|undefined');
    assert.equal(calls, 2, "('a','b') and ('ab') must not collide");
    const byId = memoize((obj) => { calls += 1; return obj; });
    const o = { id: 1 };
    assert.equal(byId(o), o);
    assert.equal(byId(o), o);
    assert.equal(calls, 3, 'unary fast path keys by identity');
});

test('debounce fires once on the trailing edge with the last args', async () => {
    let got = null;
    let fires = 0;
    const d = debounce((v) => { got = v; fires += 1; }, 20);
    d(1);
    d(2);
    d(3);
    await new Promise((r) => setTimeout(r, 60));
    assert.equal(fires, 1);
    assert.equal(got, 3);
});

test('debounce cancels via .cancel() and AbortSignal', async () => {
    let fires = 0;
    const d = debounce(() => { fires += 1; }, 10);
    d();
    d.cancel();
    const ac = new AbortController();
    const d2 = debounce(() => { fires += 1; }, 10, { signal: ac.signal });
    d2();
    ac.abort();
    d2(); // post-abort calls are ignored
    await new Promise((r) => setTimeout(r, 40));
    assert.equal(fires, 0);
});

test('throttle fires on the leading edge and once more on the trailing edge', async () => {
    const seen = [];
    const t = throttle((v) => seen.push(v), 30);
    t(1); // leading: immediate
    t(2);
    t(3); // trailing: fires with 3
    assert.deepEqual(seen, [1]);
    await new Promise((r) => setTimeout(r, 80));
    assert.deepEqual(seen, [1, 3]);
});
