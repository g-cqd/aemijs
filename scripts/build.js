/**
 * Build minified ESM bundles for CDN / <script type="module"> usage.
 *
 * Modern consumers should import the source ESM directly (no build needed);
 * these bundles exist only for drop-in <script> / CDN delivery. Uses `bun build`
 * (zero extra npm dependencies). Run: `npm run build`.
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const targets = [
    { entry: 'src/core/index.js', outfile: 'dist/aemi.min.js', label: 'core (aemijs)' },
    { entry: 'src/dom/index.js', outfile: 'dist/aemi.dom.min.js', label: 'dom  (aemijs/dom)' },
];

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });

for (const { entry, outfile, label } of targets) {
    try {
        execFileSync('bun', [
            'build', entry,
            '--outfile', outfile,
            '--minify',
            '--target', 'browser',
            '--external', 'node:worker_threads',
            '--external', 'node:fs/promises',
        ], { stdio: ['ignore', 'ignore', 'inherit'] });
    } catch (error) {
        console.error('Build failed. Is `bun` installed? (https://bun.sh)');
        throw error;
    }
    const bytes = readFileSync(outfile);
    const gzip = gzipSync(bytes);
    const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
    console.log(`${label.padEnd(20)} ${kb(bytes.length).padStart(9)} min  ${kb(gzip.length).padStart(9)} min+gzip  -> ${outfile}`);
}
