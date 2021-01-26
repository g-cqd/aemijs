const {
    getGlobal,
    isBrowser,
    isNode,
    isWorker,
    ObjectForEach,
    ObjectMap,
    newUID
} = require( './node/utils.js' );

const {
    Dataset,
    DatasetEncoder,
    DatasetHeader
} = require( './node/dataset.js' );

const {
    IArray
} = require( './node/immutable.js' );

const {
    ImageLoader
} = require( './node/loader.js' );

const {
    Easing
} = require( './node/math.js' );

const {
    ExtendedWorker
} = require( './node/multithread.js' );

const {
    Benchmark
} = require( './node/perf.js' );

module.exports = {
    getGlobal,
    isBrowser,
    isNode,
    isWorker,
    ObjectForEach,
    ObjectMap,
    newUID,
    Dataset,
    DatasetEncoder,
    DatasetHeader,
    IArray,
    ImageLoader,
    Easing,
    ExtendedWorker,
    Benchmark
};
