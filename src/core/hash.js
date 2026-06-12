/**
 * aemijs/hash — fast non-cryptographic hashing; the platform ships none
 * (`crypto.subtle` is async and cryptographic — wrong tool for hash maps,
 * caches, bloom filters, and ETag-ish fingerprints).
 *
 * Domain note (measured): pure JS wins the short-key regime — below ~64 bytes
 * on V8 and ~256-512 bytes on JSC these beat xxhash-wasm 3-5x (no JS↔WASM
 * boundary or string-encoding cost); for ≥1KB bulk payloads WASM wins 2-4.5x.
 * These are short-key hashes by design. NOT for passwords or signatures.
 *
 * String inputs hash UTF-16 code units: identical results across runtimes,
 * but not equal to hashing the string's UTF-8 bytes when it contains
 * non-ASCII characters (encode first and use `xxh32` if you need that).
 */

/**
 * FNV-1a, 32-bit — the fastest option for short ASCII-ish keys (≤64B).
 * @param {string} str
 * @param {number} [seed] - Offset basis; defaults to the FNV standard.
 * @returns {number} Unsigned 32-bit hash.
 */
export function fnv1a(str, seed = 0x811c9dc5) {
    let h = seed | 0;
    for (let i = 0; i < str.length; i += 1) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
}

/**
 * cyrb53 (bryc, public domain) — 53-bit hash with excellent distribution; the
 * result fits a JS safe integer, so collisions are far rarer than any 32-bit
 * hash while staying dependency-free.
 * @param {string} str
 * @param {number} [seed]
 * @returns {number} 53-bit hash as a safe integer.
 */
export function cyrb53(str, seed = 0) {
    let h1 = 0xdeadbeef ^ seed;
    let h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i += 1) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

const P1 = 0x9e3779b1;
const P2 = 0x85ebca77;
const P3 = 0xc2b2ae3d;
const P4 = 0x27d4eb2f;
const P5 = 0x165667b1;

/**
 * xxHash32 over raw bytes — bit-exact with the reference implementation
 * (verified against xxhash-wasm across 2000 random buffers and seeds).
 * @param {Uint8Array} b
 * @param {number} [seed]
 * @returns {number} Unsigned 32-bit hash.
 */
export function xxh32(b, seed = 0) {
    const len = b.length;
    let h;
    let i = 0;
    if (len >= 16) {
        let v1 = (seed + P1 + P2) | 0;
        let v2 = (seed + P2) | 0;
        let v3 = seed | 0;
        let v4 = (seed - P1) | 0;
        for (const n = len - 16; i <= n; i += 16) {
            v1 = (v1 + Math.imul(b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24), P2)) | 0;
            v1 = Math.imul((v1 << 13) | (v1 >>> 19), P1);
            v2 = (v2 + Math.imul(b[i + 4] | (b[i + 5] << 8) | (b[i + 6] << 16) | (b[i + 7] << 24), P2)) | 0;
            v2 = Math.imul((v2 << 13) | (v2 >>> 19), P1);
            v3 = (v3 + Math.imul(b[i + 8] | (b[i + 9] << 8) | (b[i + 10] << 16) | (b[i + 11] << 24), P2)) | 0;
            v3 = Math.imul((v3 << 13) | (v3 >>> 19), P1);
            v4 = (v4 + Math.imul(b[i + 12] | (b[i + 13] << 8) | (b[i + 14] << 16) | (b[i + 15] << 24), P2)) | 0;
            v4 = Math.imul((v4 << 13) | (v4 >>> 19), P1);
        }
        h = (((v1 << 1) | (v1 >>> 31)) + ((v2 << 7) | (v2 >>> 25))
            + ((v3 << 12) | (v3 >>> 20)) + ((v4 << 18) | (v4 >>> 14))) | 0;
    } else {
        h = (seed + P5) | 0;
    }
    h = (h + len) | 0;
    for (const n = len - 4; i <= n; i += 4) {
        h = (h + Math.imul(b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24), P3)) | 0;
        h = Math.imul((h << 17) | (h >>> 15), P4);
    }
    for (; i < len; i += 1) {
        h = (h + Math.imul(b[i], P5)) | 0;
        h = Math.imul((h << 11) | (h >>> 21), P1);
    }
    h ^= h >>> 15;
    h = Math.imul(h, P2);
    h ^= h >>> 13;
    h = Math.imul(h, P3);
    return (h ^ (h >>> 16)) >>> 0;
}

export default { fnv1a, cyrb53, xxh32 };
