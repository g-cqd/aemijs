import { test } from 'node:test';
import assert from 'node:assert/strict';
import { measure, Benchmark } from '../src/core/bench.js';

test('measure returns positive timing stats within the time budget', async () => {
    const result = await measure(() => Math.sqrt(123), { duration: 40, warmup: 5 });
    assert.ok(result.iterations > 0);
    assert.ok(result.opsPerSec > 0);
    assert.ok(result.nsPerOp > 0);
    assert.ok(result.elapsedMs >= 40);
});

test('measure supports async functions under test', async () => {
    const result = await measure(async () => { await Promise.resolve(); }, { duration: 30, warmup: 2 });
    assert.ok(result.iterations > 0);
});

test('Benchmark ranks faster functions first', async () => {
    const results = await new Benchmark()
        .add('fast', () => 1 + 1)
        .add('slow', () => { let s = 0; for (let i = 0; i < 5000; i += 1) { s += i; } return s; })
        .run({ duration: 40, warmup: 3 });
    assert.equal(results.length, 2);
    assert.equal(results[0].name, 'fast');
    assert.ok(results[0].opsPerSec >= results[1].opsPerSec);
});
