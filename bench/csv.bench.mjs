/** CSV: aemijs parseCSV vs papaparse vs udsv (fastest JS CSV parser). */

import { bench, run, do_not_optimize } from 'mitata';
import Papa from 'papaparse';
import { inferSchema, initParser } from 'udsv';
import { parseCSV } from '../src/core/data.js';
import { mulberry32, randInt } from '../src/core/rand.js';

const rng = mulberry32(1);

const numeric = Array.from({ length: 50000 }, () =>
    Array.from({ length: 10 }, () => rng.u32() % 100000).join(','),
).join('\n');

const words = ['plain', 'with,comma', 'quote"inside', 'multi\nline', 'simple'];
const quoted = Array.from({ length: 25000 }, () =>
    Array.from({ length: 6 }, () => {
        const w = words[randInt(0, words.length - 1, rng)];
        return randInt(0, 9, rng) < 3 ? `"${w.replaceAll('"', '""')}"` : 'plainfield';
    }).join(','),
).join('\n');

const mb = (s) => (s.length / 1048576).toFixed(2);
console.log(`datasets: NUMERIC ${mb(numeric)} MB (50k x 10), QUOTED ${mb(quoted)} MB (25k x 6)`);

const schemaN = inferSchema(numeric);
const schemaQ = inferSchema(quoted);

bench('aemijs parseCSV — NUMERIC', () => do_not_optimize(parseCSV(numeric)));
bench('papaparse       — NUMERIC', () => do_not_optimize(Papa.parse(numeric).data));
bench('udsv            — NUMERIC', () => do_not_optimize(initParser(schemaN).stringArrs(numeric)));

bench('aemijs parseCSV — QUOTED', () => do_not_optimize(parseCSV(quoted)));
bench('papaparse       — QUOTED', () => do_not_optimize(Papa.parse(quoted).data));
bench('udsv            — QUOTED', () => do_not_optimize(initParser(schemaQ).stringArrs(quoted)));

await run();
