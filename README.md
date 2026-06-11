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
`<script type="module">` / CDN drop-in, `npm run build` emits minified bundles
(`dist/aemi.min.js`, **~5 KB gzipped**).

## Runtime support

| Subpath | Node | Bun | Deno | Browser |
|---|:--:|:--:|:--:|:--:|
| `aemijs/workers` | ✅ | ✅ | ✅ | ✅ |
| `aemijs/fp` · `/math` · `/bench` | ✅ | ✅ | ✅ | ✅ |
| `aemijs/data` | ✅ | ✅ | ✅ | ✅ |
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
    .table();   // ranks by ops/sec, fastest first
```

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

## Development

```sh
npm test            # node --test
npm run test:bun    # bun test
npm run test:deno   # deno test
npm run lint        # eslint (flat config)
npm run build       # minified ESM bundles via `bun build`
```

The same `test/*.js` suite (`node:test`) runs green on Node, Bun and Deno; the
DOM suite runs against `happy-dom`.

## License

MIT
