/* eslint-env browser */

import { getGlobal, newUID } from './utils.js';
/**
 * Benchmark JavaScript Code
 */
class Benchmark {
    /**
     * @param {{logging:Boolean}} [options] - Options passed to Benchmark
     */
    constructor ( options = {} ) {
        this.perf = getGlobal().performance;
        this.options = {
            _logging: options.logging || false,
            _iterations: undefined,
            _last: undefined
        };
        this.match = {};
        this.metrics = new Map();
        this.pool = new Map();
        this.testPool = new Map();
        this.ticks = [];
    }
    /**
     * @returns {String}
     */
    get uid() {
        return newUID( 10 );
    }
    /**
     * @returns {String}
     */
    set last( value ) {
        return this.options._last = value;
    }
    /**
     * @returns {String}
     */
    get last() {
        return this.options._last;
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
        const { uid } = this;
        this.last = uid;
        this.match[uid] = label;
        this.pool.set( uid, () => {
            let end;
            let elapsed = 0;
            let i = 0;
            let test = this.testPool.get( uid );
            let start;
            if ( test ) {
                do {
                    start = this.perf.now();
                    const result = func( ...args );
                    elapsed += this.perf.now() - start;
                    if ( !test( result ) ) {
                        console.group( `Test Failed - ${label}` );
                        console.error( 'Test Function', test );
                        console.error( 'Tested Result', result );
                        console.groupEnd( `Test Failed - ${label}` );
                        throw new Error( 'Test failed.' );
                    }
                } while ( ( i++, elapsed < 5000 ) );
            }
            else {
                start = this.perf.now();
                do {
                    func( ...args );
                } while ( ( i++, end = this.perf.now() ) < start + 5000 );
                elapsed = end - start;
            }
            const ops = i / ( elapsed / 1000 );
            const result = { ops, elapsed, iterations: i };
            console.log( `Func ${label}\n\t> ${ops.toFixed( 3 )} op/s\n\t> ${i} op` );
            this.metrics.set( uid, result );
            return result;
        } );
        return this;
    }
    /**
     * @callback callback
     * @param {any} result
     * @returns {Boolean}
     */
    /**
     * @param {callback} func 
     */
    test( func ) {
        const { last: uid } = this;
        this.testPool.set( uid, func );
        this.last = undefined;
        return this;
    }
    /**
     * @returns {void}
     */
    start() {
        const now = this.perf.now();
        if ( this.logging ) {
            console.warn( `Started ${now} ms after page load.` );
        }
        this.ticks.push( now );
    }
    /**
     * @returns {Number}
     */
    tick() {
        const now = this.perf.now();
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
        const now = this.perf.now();
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
