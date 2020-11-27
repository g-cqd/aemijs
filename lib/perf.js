import { isBrowser, isNode, getGlobal } from './utils.js';

/**
 * Measure Execution Time of a Function
 * 
 * #node-compatible
 * 
 * @param {Function} func
 * @param  {...any} args
 */
const measure = function ( func, ...args ) {
    let performance;
    if ( isNode ) {
        performance = require( 'perf_hooks' ).performance;
    }
    else if ( isBrowser ) {
        performance = getGlobal().performance;
    }
    return {
        async parallel( iterNumber ) {
            const iterArray = new Array( iterNumber ).fill( null );
            const iterPromises = iterArray.map( () => () => new Promise( resolve => {
                const start = performance.now();
                const result = func( ...args );
                if ( result instanceof Promise ) {
                    return result.then( () => resolve( performance.now() - start ) );
                }
                else {
                    return resolve( performance.now() - start );
                }
            } ) );
            const start = performance.now();
            const result = await Promise.all( iterPromises.map( func => func() ) );
            const elapsed = performance.now() - start;
            const durations = [];
            let max = 0;
            let min = Infinity;
            const sum = ( result.reduce( ( ac, cu ) =>
                ( cu > max ? max = cu : cu < mi ? mi = cu : true, durations.push( cu ), ( ac += cu, ac ) ), 0 ) );
            const returnValue = {
                min: min,
                max: max,
                all: durations,
                average: sum / iterNumber,
                total: sum,
                real: elapsed
            };
            return Object.assign( Object.create( null ), {
                log() {
                    console.log( returnValue );
                },
                ...returnValue
            } );
        },
        async sequential( iterNumber ) {
            const list = [];
            let max = 0;
            let min = Infinity;
            let sum = 0;
            const start = performance.now();
            for ( let i = 0; i < iterNumber; i += 1 ) {
                const start = performance.now();
                const result = func( ...args );
                let elapsed = performance.now() - start;
                if ( result instanceof Promise ) {
                    elapsed = ( await result, performance.now() - start );
                }
                ( max < elapsed ? max = elapsed : min > elapsed ? min = elapsed : true, list.push( elapsed ), sum += elapsed );
            }
            const elapsed = performance.now() - start;
            const returnValue = {
                min: min,
                max: max,
                all: list,
                average: sum / iterNumber,
                total: sum,
                real: elapsed
            };
            return Object.assign( Object.create( null ), {
                log() {
                    console.log( returnValue );
                },
                ...returnValue
            } );
        }

    };
}

export {
    measure
};
