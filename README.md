# aemijs

A tiny, **dependency-free**, **cross-runtime** toolkit of bleeding-edge vanilla
JavaScript. One ESM codebase that runs on **Node, Bun, Deno, and browsers** — no
TypeScript, no build step required to use it.

The headline feature: run any function **off the main thread** anywhere, with one
call. The rest is a small, curated set of helpers the platform still doesn't give
you (composition, easings, arbitrary-precision math, a correct CSV + label
encoder, a microbench, and a safe DOM builder).

> This is the 2026 rewrite. The original `es-module` / `node-module` branches are
> preserved as the `archive/*` tags. ~85% of the old code was deleted because the
> platform now does it natively; what remained was unified, de-bugged, and
> hardened.

## Install

```sh
npm install aemijs   # or: bun add aemijs / deno add npm:aemijs
```

```js
import { run } from 'aemijs/workers';
import { pipe } from 'aemijs/fp';
import { Dataset } from 'aemijs/data';
// browser only:
import { ecs, Wait, Cookies } from 'aemijs/dom';
```

Modern runtimes import the source ESM directly — no bundling needed. For a
`<script type="module">` / CDN drop-in, `bun run build` emits minified bundles
(`dist/aemi.min.js`, **~8.6 KB gzipped** for the whole core — subpath imports
stay far leaner).

## Runtime support

| Subpath | Node | Bun | Deno | Browser |
|---|:--:|:--:|:--:|:--:|
| `aemijs/workers` | ✅ | ✅ | ✅ | ✅ |
| `aemijs/fp` · `/math` · `/bench` | ✅ | ✅ | ✅ | ✅ |
| `aemijs/data` · `/rand` · `/hash` · `/struct` | ✅ | ✅ | ✅ | ✅ |
| `aemijs/dom` | — | — | — | ✅ |

## `aemijs/workers` — off-thread, everywhere

```js
import { run, spawn, WorkerPool } from 'aemijs/workers';

// One-shot: spin a worker, run the function, return the result, terminate.
const total = await run((rows) => rows.reduce((a, b) => a + b, 0), bigArray);

// Reusable worker for repeated calls.
const hasher = await spawn((s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0));
await hasher.call('hello');
await hasher.terminate();        // or: await using h = await spawn(fn)

// A real pool with an idle-dispatch queue (sized from hardwareConcurrency).
const pool = new WorkerPool((url) => fetch(url).then((r) => r.json()), { size: 4 });
const results = await Promise.all(urls.map((u) => pool.call(u)));
await pool.terminate();
```

Functions are serialized with `toString()`, so they must be **self-contained**
(no captured outer variables). Built on `Promise.withResolvers()`, transfers
ArrayBuffers when you pass `{ transfer: [...] }`, supports `AbortSignal`, and
**rejects in-flight calls** when a worker errors or exits (no hanging promises,
no leaked Blob URLs).

## `aemijs/fp` — composition

```js
import { pipe, compose, pipeAsync, tap } from 'aemijs/fp';

const slugify = pipe(
    (s) => s.trim().toLowerCase(),
    tap((s) => console.debug('slug input:', s)),
    (s) => s.replace(/\s+/g, '-'),
);
slugify('  Hello World ');          // => "hello-world"

await pipeAsync(fetchUser, (u) => u.id, loadOrders)(42);
```

## `aemijs/math` — what the platform lacks

```js
import { Easing, div, fact, fib } from 'aemijs/math';

Easing.easeInOutCubic(t, 0, 100, 1000);   // classic Penner timing functions
div(1, 3, 12).toString();                 // "0.333333333333"  (exact long division)
fact(30);                                 // 265252859812191058636308480000000n
fib(100);                                 // 354224848179261915075n
```

## `aemijs/data` — CSV + label encoding

```js
import { Dataset, LabelEncoder, coercers } from 'aemijs/data';

const ds = await Dataset.load('https://example.com/people.csv', {
    types: { age: coercers.number },        // typed columns
});
ds.filter((r) => r.age >= 18)               // non-mutating
  .sortBy('age', { numeric: true, descending: true })
  .groupBy('city');                         // native Map.groupBy

const { dataset, encoder } = ds.encode('city');   // O(1) Map-backed encoder
encoder.oneHot('Paris');                          // [0, 1, 0, ...]
```

Quoted fields, embedded commas/newlines and escaped quotes are parsed correctly;
`fetch` loads are guarded by an `AbortSignal` timeout; counts use a `Map` (no
prototype-pollution from `__proto__`-style keys).

## `aemijs/bench` — quick, honest microbench

```js
import { Benchmark } from 'aemijs/bench';

await new Benchmark()
    .add('Map.groupBy', () => Map.groupBy(items, keyOf))
    .add('manual', () => manualGroup(items, keyOf))
    .table();   // ranks by ops/sec (median), with p99 and ±stddev
```

Measures the way mitata does: per-function generated kernels (monomorphic call
sites, with a closure fallback under strict CSP), auto-calibrated ≥0.5 ms
batches between clock reads, a DCE sink, and median/p99 stats — the previous
per-iteration-`await` design under-reported sync throughput by 500-950×.

## `aemijs/rand` — seeded randomness

```js
import { splitmix32, xoshiro128ss, randInt, shuffle } from 'aemijs/rand';

const rng = splitmix32(42);     // deterministic; ~1.9x faster than Math.random on V8
rng();                          // float in [0, 1)
rng.u32();                      // raw uint32
randInt(1, 6, rng);             // unbiased (rejection-sampled) die roll
shuffle(deck, rng);             // seeded Fisher-Yates, returns a new array
```

## `aemijs/hash` — short-key hashing (no platform equivalent)

```js
import { fnv1a, cyrb53, xxh32 } from 'aemijs/hash';

fnv1a('cache-key');                          // u32 — fastest for keys ≤64B
cyrb53('cache-key');                         // 53-bit — far fewer collisions
xxh32(bytes);                                // bit-exact xxHash32 over Uint8Array
```

Measured: these beat `xxhash-wasm` 3-5× below ~64B (V8) / ~256-512B (JSC)
because nothing crosses the JS↔WASM boundary. For ≥1KB bulk payloads WASM wins
2-4× — these are short-key hashes by design, and never for passwords.

## `aemijs/struct` — Deque, MinHeap, LRU

```js
import { Deque, MinHeap, LRU } from 'aemijs/struct';

const queue = new Deque();      // ring buffer: Array#shift goes O(n²) on V8
queue.push(job); queue.shift(); // (measured: 1000ms vs 9ms draining 100k)

const pq = new MinHeap((a, b) => a.priority - b.priority);
pq.push(task); pq.pop();        // 3.5-4.7x faster than sorted-array insertion

const cache = new LRU(10_000);  // exact LRU, O(1) eviction via a persistent
cache.set(key, value);          // Map iterator (the naive Map idiom is 8-20x
cache.get(key);                 // slower). lru-cache is ~1.2x faster; this is
                                // the zero-dependency option.
```

`aemijs/fp` also gained `once`, `memoize` (≈2 ns hit overhead), `debounce`, and
`throttle` (cancellable via `.cancel()` / `AbortSignal`) — TC39 withdrew its
function-helpers proposal, so the platform won't be providing these.

## `aemijs/dom` — browser-only helpers

```js
import { ecs, Wait, Cookies } from 'aemijs/dom';

document.body.append(ecs({
    t: 'button', class: ['btn', 'primary'], _: 'Save',
    events: [['click', save]],
}));

await Wait.interactive();                 // resolves at DOMContentLoaded
await Cookies.set('token', 'a=b==', { sameSite: 'strict' });   // cookieStore-first
```

`ecs` appends string children as **text** (XSS-safe); use `html:` for sanitized
markup (via the Sanitizer API / a DOMPurify hook) or `unsafeHTML:` for trusted
markup. `Cookies` prefers the async `cookieStore` API and falls back to
`document.cookie`.

## Performance

Everything below is measured (Apple Silicon, Node 26 / Bun 1.3 / Deno 2.8,
mitata) and reproducible from the committed suite: `bun run bench` (per file:
`node bench/<file>.bench.mjs`, `deno run -A bench/<file>.bench.mjs`).

| Workload | aemijs vs … | Result |
|---|---|---|
| CSV parse (8MB numeric / 2.7MB quoted) | papaparse | **1.7-2.6× faster** everywhere |
| | udsv (fastest JS parser) | **wins quoted data** on all runtimes + everything on Bun; trails udsv's schema-codegen on V8 small/numeric (≤1.8×) |
| Worker RPC echo (tiny msg) | Comlink | **~20-30% faster** (21µs vs 27µs on Bun) |
| Worker RPC (1MB clone) | Comlink | **~1.7-2× faster** (replies auto-transfer) |
| 64 × 1ms jobs | single worker | **3.9× faster** (pool + 2-deep pipelining) |
| fib / fact / div (BigInt) | naive algorithms | **16-167× / 3.5-35× / 1.8-4.7×** (fast-doubling, binary-split, base-1e9 chunking) |
| Short-key hashing (≤64B) | xxhash-wasm | **3-5× faster** (no JS↔WASM boundary) |
| FIFO at depth (drain 100k) | `Array#shift` on V8 | **~110× faster** (ring buffer vs O(n²)) |
| LRU (100k ops @10k cap) | naive Map idiom | **8-20× faster** (persistent-iterator eviction) |

Honest losses, documented where they live: udsv's codegen wins V8
small/numeric CSV; `lru-cache` is ~1.2× faster than our zero-dep `LRU`;
WASM wins bulk (≥1KB) hashing; a pool loses to a single pipelined worker on
trivial (<0.1ms) jobs; one-shot `run()` pays 2-19ms of worker startup — use
`spawn`/`WorkerPool` for repeated calls.

## Development

Bun drives the tooling; the library and tests stay runtime-portable.

```sh
bun install         # deps (bun.lock)
bun test test/      # primary test run
bun run test:node   # same suite on Node (node --test)
bun run test:deno   # same suite on Deno
bun run lint        # eslint (flat config)
bun run build       # minified ESM bundles via Bun.build()
bun run bench       # mitata benchmark suite vs SOTA packages
```

The same `test/*.js` suite (`node:test`) runs green on Bun, Node and Deno; the
DOM suite runs against `happy-dom`.

> Breaking change vs the initial rewrite: `div()`'s `decimal` field is now a
> digit *string* (was `number[]`); `toString()` output is unchanged.

## License

MIT
