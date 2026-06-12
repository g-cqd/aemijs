/**
 * Run every bench file sequentially, each in a fresh process (avoids cross-case
 * JIT pollution). Canonical: `bun bench/run.mjs`. Also works under Node; for
 * Deno run files individually: `deno run -A bench/<file>.bench.mjs`.
 */

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const files = ['csv', 'math', 'workers', 'hash', 'rand-struct']
    .map((name) => fileURLToPath(new URL(`./${name}.bench.mjs`, import.meta.url)));

const isDeno = typeof globalThis.Deno !== 'undefined';
for (const file of files) {
    console.log(`\n━━━ ${file.split('/').pop()} ━━━`);
    const args = isDeno ? ['run', '-A', file] : [file];
    const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
    if (result.status !== 0) {
        process.exitCode = 1;
    }
}
