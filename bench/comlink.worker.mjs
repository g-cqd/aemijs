/** Echo worker for the Comlink comparison in workers.bench.mjs. */

import * as Comlink from 'comlink';

const g = globalThis;
const isNode = typeof g.process !== 'undefined' && !!g.process?.versions?.node
    && typeof g.Bun === 'undefined' && typeof g.Deno === 'undefined';

const api = { echo: (x) => x };

if (isNode) {
    const { parentPort } = await import('node:worker_threads');
    const nodeEndpoint = (await import('comlink/dist/esm/node-adapter.mjs')).default;
    Comlink.expose(api, nodeEndpoint(parentPort));
} else {
    Comlink.expose(api);
}
