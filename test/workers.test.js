import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run, spawn, WorkerPool, hardwareConcurrency, RUNTIME } from '../src/core/workers.js';

test('run executes a function off-thread', async () => {
    const result = await run((n) => n * 2, 21);
    assert.equal(result, 42);
});

test('run supports async functions', async () => {
    const result = await run(async (n) => {
        await new Promise((r) => setTimeout(r, 5));
        return n + 1;
    }, 41);
    assert.equal(result, 42);
});

test('run passes structured-cloneable data', async () => {
    const result = await run((rows) => rows.reduce((a, b) => a + b, 0), [1, 2, 3, 4]);
    assert.equal(result, 10);
});

test('run rejects with the worker error (message + name preserved)', async () => {
    await assert.rejects(
        run(() => { throw new TypeError('boom'); }),
        (err) => err instanceof Error && err.name === 'TypeError' && err.message === 'boom',
    );
});

test('spawn reuses one worker across calls', async () => {
    const worker = await spawn((n) => n * n);
    try {
        assert.equal(await worker.call(2), 4);
        assert.equal(await worker.call(5), 25);
        assert.equal(await worker.call(9), 81);
    } finally {
        await worker.terminate();
    }
});

test('WorkerPool runs jobs concurrently and returns all results', async () => {
    const pool = new WorkerPool((n) => n * 10, { size: 3 });
    try {
        const out = await Promise.all([1, 2, 3, 4, 5].map((n) => pool.call(n)));
        assert.deepEqual(out, [10, 20, 30, 40, 50]);
    } finally {
        await pool.terminate();
    }
});

test('WorkerPool burst: 1000 queued jobs all resolve correctly (ring queue + pipelining)', async () => {
    const pool = new WorkerPool((n) => n + 1, { size: 4 });
    try {
        const jobs = Array.from({ length: 1000 }, (_, i) => pool.call(i));
        const out = await Promise.all(jobs);
        for (let i = 0; i < 1000; i += 1) {
            assert.equal(out[i], i + 1);
        }
    } finally {
        await pool.terminate();
    }
});

test('WorkerPool terminate rejects queued jobs', async () => {
    const pool = new WorkerPool(async (ms) => {
        await new Promise((r) => setTimeout(r, ms));
        return ms;
    }, { size: 1 });
    const slow = pool.call(1000);
    const queued = pool.call(1000);
    await new Promise((r) => setTimeout(r, 50)); // let init+dispatch happen
    await pool.terminate();
    await assert.rejects(slow);
    await assert.rejects(queued);
});

test('transfer moves an ArrayBuffer without copying', async () => {
    const buf = new Uint8Array([1, 2, 3, 4]).buffer;
    const sum = await run((ab) => new Uint8Array(ab).reduce((a, b) => a + b, 0), buf, { transfer: [buf] });
    assert.equal(sum, 10);
    assert.equal(buf.byteLength, 0, 'source buffer should be detached after transfer');
});

test('AbortSignal rejects a pending call', async () => {
    const worker = await spawn(async (ms) => { await new Promise((r) => setTimeout(r, ms)); return 'done'; });
    try {
        const ac = new AbortController();
        const p = worker.call(1000, { signal: ac.signal });
        ac.abort();
        await assert.rejects(p, (err) => err.name === 'AbortError');
    } finally {
        await worker.terminate();
    }
});

test('hardwareConcurrency reports a positive integer', () => {
    assert.ok(hardwareConcurrency() >= 1);
    assert.ok(['node', 'bun', 'deno', 'browser'].includes(RUNTIME));
});
