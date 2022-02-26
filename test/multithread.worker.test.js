const _ = require('../src/multithread').getHandler();

console.log('in worker 2 -- ');

_.run(x => x * 10);
