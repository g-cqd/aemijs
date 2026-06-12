/**
 * Build minified ESM bundles for CDN / <script type="module"> usage, via the
 * Bun.build() JS API. Run: `bun scripts/build.js` (or `bun run build`).
 *
 * Modern consumers should import the source ESM directly (no build needed);
 * these bundles exist only for drop-in <script> / CDN delivery.
 */

import { rmSync, mkdirSync } from 'node:fs';

if (typeof Bun === 'undefined') {
    console.error('This build script runs under Bun: `bun scripts/build.js` (https://bun.sh)');
    process.exit(1);
}

const targets = [
    { entry: 'src/core/index.js', out: 'aemi.min.js', label: 'core (aemijs)' },
    { entry: 'src/dom/index.js', out: 'aemi.dom.min.js', label: 'dom  (aemijs/dom)' },
];

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

for (const { entry, out, label } of targets) {
    const result = await Bun.build({
        entrypoints: [entry],
        minify: true,
        target: 'browser',
        external: ['node:worker_threads', 'node:fs/promises'],
        naming: out,
        outdir: 'dist',
    });
    if (!result.success) {
        for (const log of result.logs) {
            console.error(log);
        }
        process.exit(1);
    }
    const artifact = result.outputs[0];
    const bytes = new Uint8Array(await artifact.arrayBuffer());
    const gzipped = Bun.gzipSync(bytes);
    console.log(`${label.padEnd(20)} ${kb(bytes.length).padStart(9)} min  ${kb(gzipped.length).padStart(9)} min+gzip  -> dist/${out}`);
}
