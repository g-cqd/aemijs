import { test } from 'node:test';
import assert from 'node:assert/strict';
import { measure, Benchmark } from '../src/core/bench.js';

test('measure returns full timing stats', async () => {
    const result = await measure(() => Math.sqrt(123), { duration: 60 });
    assert.ok(result.opsPerSec > 0);
    assert.ok(result.nsPerOp > 0);
    assert.equal(result.nsPerOp, result.p50);
    assert.ok(result.p99 >= result.p50);
    assert.ok(result.stddev >= 0);
    assert.ok(result.mean > 0);
    assert.ok(result.samples >= 1);
    assert.ok(result.batchSize >= 1);
    assert.equal(result.iterations, result.samples * result.batchSize);
    assert.ok(result.elapsedMs > 0);
});

test('measure supports async functions under test', async () => {
    const result = await measure(async () => { await Promise.resolve(); }, { duration: 40 });
    assert.ok(result.opsPerSec > 0);
    assert.ok(result.samples >= 1);
});

test('measure batches sync work (no per-iteration await/clock floor)', async () => {
    // The old harness flat-lined every sync fn at ~10-20M ops/s. Batched
    // kernels must show a huge relative gap between a trivial fn and a
    // 1000-iteration spin — relative assertion only (CI speed varies).
    const trivial = await measure(() => 1, { duration: 80 });
    const spin = await measure(() => {
        let s = 0;
        for (let i = 0; i < 1000; i += 1) {
            s += i;
        }
        return s;
    }, { duration: 80 });
    assert.ok(
        trivial.opsPerSec > spin.opsPerSec * 50,
        `expected trivial (${Math.round(trivial.opsPerSec)}) >> spin (${Math.round(spin.opsPerSec)})`,
    );
});

test('Benchmark ranks faster functions first', async () => {
    const results = await new Benchmark()
        .add('fast', () => 1 + 1)
        .add('slow', () => { let s = 0; for (let i = 0; i < 5000; i += 1) { s += i; } return s; })
        .run({ duration: 40 });
    assert.equal(results.length, 2);
    assert.equal(results[0].name, 'fast');
    assert.ok(results[0].opsPerSec >= results[1].opsPerSec);
});
