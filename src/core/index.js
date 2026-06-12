/**
 * aemijs — a tiny, dependency-free, cross-runtime toolkit of bleeding-edge JS.
 *
 * The default entry bundles the cross-runtime core. Browser-only helpers live
 * under `aemijs/dom`. Import a subpath (`aemijs/workers`, `aemijs/fp`, …) to
 * pull in just what you need.
 */

export * as workers from './workers.js';
export * as fp from './fp.js';
export * as math from './math.js';
export * as data from './data.js';
export * as bench from './bench.js';
export * as rand from './rand.js';
export * as hash from './hash.js';
export * as struct from './struct.js';

// Headline worker API re-exported at the top level for convenience.
export { run, spawn, WorkerPool, hardwareConcurrency, RUNTIME } from './workers.js';

import * as workers from './workers.js';
import * as fp from './fp.js';
import * as math from './math.js';
import * as data from './data.js';
import * as bench from './bench.js';
import * as rand from './rand.js';
import * as hash from './hash.js';
import * as struct from './struct.js';

export default { workers, fp, math, data, bench, rand, hash, struct };
