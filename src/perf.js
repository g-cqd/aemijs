import { getGlobal, isBrowser, isNode } from './utils.js';
/**
 * Benchmark JavaScript Code
 */
class Benchmark {
    /**
     * @param {{logging:Boolean}} options - Options passed to Benchmark
     */
    constructor ( options = {} ) {
        if ( isNode() ) {
            this.perf = require( 'perf_hooks' ).performance;
        }
        else if ( isBrowser() ) {
            this.perf = getGlobal().performance;
        }
        this.options = {
            _logging: options.logging || false,
            _iterations: undefined
        };
        this.match = {};
        this.metrics = new Map();
        this.pool = new Map();
        this.ticks = [];
    }
    /**
     * @returns {String}
     */
    get uuid() {
        const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        return ( new Array( 10 ).fill( null ) )
            .map( ( _0, _1, { length } ) => numbers[Math.floor( Math.random() * length )] )
            .join( '' );
    }
    /**
     * @returns {Boolean}
     */
    get logging() {
        return this.options._logging;
    }
    /**
     * @returns {Number|undefined}
     */
    get iterations() {
        return this.options._iterations;
    }
    /**
     * @param {Number} value
     * @returns {void}
     */
    set iterations( value ) {
        this.options._iterations = value;
    }
    /**
     * 
     * @param {String} label 
     * @param {Function} func 
     * @param  {...any} args 
     * @returns {Benchmark}
     */
    add( label, func, ...args ) {
        const { uuid } = this;
        this.match[uuid] = label;
        this.pool.set( uuid, () => {
            let end;
            let elapsed;
            let i = 0;
            let start = performance.now();
            do {
                func( ...args );
            } while ( ( i++, end = performance.now() ) < start + 5000 );
            elapsed = end - start;
            const ops = i / ( elapsed / 1000 );
            const result = { ops, elapsed, iterations: i };
            console.log( `Func ${label}\n\t> ${ops.toFixed( 3 )} op/s\n\t> ${i} op` );
            this.metrics.set( uuid, result );
            return result;
        } );
        return this;
    }
    /**
     * @returns {void}
     */
    start() {
        const now = performance.now();
        if ( this.logging ) {
            console.warn( `Started ${now} ms after page load.` );
        }
        this.ticks.push( now );
    }
    /**
     * @returns {Number}
     */
    tick() {
        const now = performance.now();
        const elapsed = now - this.ticks[this.ticks.length - 1];
        if ( this.logging ) {
            console.log( `Lap : ${elapsed} ms` );
        }
        this.ticks.push( now );
        return elapsed;
    }
    /**
     * @returns {Number}
     */
    stop() {
        const now = performance.now();
        const lastLap = now - this.ticks[this.ticks.length - 1];
        const elapsed = now - this.ticks[0];
        if ( this.logging ) {
            if ( lastLap !== elapsed ) {
                console.log( `Lap : ${lastLap} ms` );
            }
            console.log( `Total : ${elapsed} ms` );
            console.warn( `Ended ${now} ms after page load.` );
        }
        this.ticks.push( now );
        return elapsed;
    }
    /**
     * @returns {Benchmark}
     */
    run() {
        const keys = [...( this.pool.keys() )];
        const values = [...( this.pool.values() )];
        console.group( 'Execution' );
        const results = values.map( func => func() );
        console.groupEnd();
        const sortMap = results.map( ( { ops }, index ) => [keys[index], ops] ).sort( ( [$0, a], [$1, b] ) => b - a );
        console.group( 'Results' );
        sortMap.forEach( ( [key, ops], index ) => {
            console.log( `#${index + 1} -- Func ${this.match[key]}\n\t> ${ops.toFixed( 3 )} op/s` );
        } );
        console.groupEnd();
        return this;
    }
}

export { Benchmark };
