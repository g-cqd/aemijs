import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fnv1a, cyrb53, xxh32 } from '../src/core/hash.js';

const enc = new TextEncoder();

test('xxh32 matches the reference vectors (verified against xxhash-wasm)', () => {
    assert.equal(xxh32(enc.encode('')), 0x02cc5d05);
    assert.equal(xxh32(enc.encode('a')), 0x550d7456);
    assert.equal(xxh32(enc.encode('abc')), 0x32d153ff);
    assert.equal(xxh32(enc.encode('Nobody inspects the spammish repetition')), 0xe2293b2f);
    assert.equal(xxh32(enc.encode('abc'), 0x9e3779b1), 0xa1ae7709);
});

test('xxh32 covers all input-length regimes (16B stripes, 4B words, tail bytes)', () => {
    for (const len of [0, 1, 3, 4, 15, 16, 17, 31, 32, 100]) {
        const bytes = new Uint8Array(len).map((_, i) => i * 7 + 1);
        const h = xxh32(bytes);
        assert.ok(Number.isInteger(h) && h >= 0 && h <= 0xffffffff);
        assert.equal(h, xxh32(bytes), 'deterministic');
    }
});

test('fnv1a matches the FNV reference values', () => {
    assert.equal(fnv1a(''), 0x811c9dc5);
    assert.equal(fnv1a('a'), 0xe40c292c);
    assert.equal(fnv1a('hello world'), 0xd58b3fa7);
});

test('cyrb53 is deterministic, seed-sensitive, and fits a safe integer', () => {
    assert.equal(cyrb53(''), 3338908027751811);
    assert.equal(cyrb53('a'), 7929297801672961);
    assert.equal(cyrb53('hello world'), 3259054761512980);
    assert.equal(cyrb53('hello world', 1), 6759793827125);
    assert.ok(Number.isSafeInteger(cyrb53('any input at all')));
});

test('different inputs hash differently (smoke)', () => {
    assert.notEqual(fnv1a('abc'), fnv1a('abd'));
    assert.notEqual(cyrb53('abc'), cyrb53('acb'));
    assert.notEqual(xxh32(enc.encode('abc')), xxh32(enc.encode('abd')));
});
