import { ExtendedWorker } from '../src/multithread.js';

const worker = ExtendedWorker.new( async () => {

    _.compute( x => {
        const result = [];
        for ( let i = 0; i < x; i++ ) {
            result.push( Math.log( i ) );
        }
        return result;
    } );

} );

console.log( worker.compute( 1000 ) );
