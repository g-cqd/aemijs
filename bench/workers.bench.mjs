/** Worker RPC: aemijs spawn/WorkerPool vs Comlink (SOTA worker RPC). */

import { bench, run, do_not_optimize } from 'mitata';
import { spawn, WorkerPool, RUNTIME } from '../src/core/workers.js';

const cleanups = [];

// --- aemijs: echo worker -----------------------------------------------------
const ours = await spawn((x) => x);
cleanups.push(() => ours.terminate());

bench(`aemijs spawn.call — tiny msg [${RUNTIME}]`, async () => {
    do_not_optimize(await ours.call(1));
});

const oneMB = new Uint8Array(1 << 20);
bench('aemijs spawn.call — 1MB clone', async () => {
    do_not_optimize(await ours.call(oneMB));
});

// --- Comlink comparison (skipped gracefully if setup fails) ------------------
try {
    const Comlink = await import('comlink');
    const workerURL = new URL('./comlink.worker.mjs', import.meta.url);
    let remote;
    if (RUNTIME === 'node') {
        const { Worker } = await import('node:worker_threads');
        const nodeEndpoint = (await import('comlink/dist/esm/node-adapter.mjs')).default;
        const w = new Worker(workerURL);
        cleanups.push(() => w.terminate());
        remote = Comlink.wrap(nodeEndpoint(w));
    } else {
        const w = new Worker(workerURL, { type: 'module' });
        cleanups.push(() => w.terminate());
        remote = Comlink.wrap(w);
    }
    await remote.echo(0); // readiness probe
    bench('comlink wrap.echo — tiny msg', async () => {
        do_not_optimize(await remote.echo(1));
    });
    bench('comlink wrap.echo — 1MB clone', async () => {
        do_not_optimize(await remote.echo(oneMB));
    });
} catch (error) {
    console.log(`comlink comparison skipped on ${RUNTIME}: ${error.message}`);
}

// --- pool throughput on ~1ms jobs (its break-even domain) --------------------
const spinner = (ms) => {
    const end = performance.now() + ms;
    let s = 0;
    while (performance.now() < end) { s += 1; }
    return s;
};
const pool = new WorkerPool(spinner, { size: 4 });
const single = await spawn(spinner);
cleanups.push(() => pool.terminate(), () => single.terminate());

bench('WorkerPool(4) — 64 x 1ms jobs', async () => {
    do_not_optimize(await Promise.all(Array.from({ length: 64 }, () => pool.call(1))));
});
bench('single worker — 64 x 1ms jobs', async () => {
    do_not_optimize(await Promise.all(Array.from({ length: 64 }, () => single.call(1))));
});

await run();
for (const cleanup of cleanups) {
    await cleanup();
}
