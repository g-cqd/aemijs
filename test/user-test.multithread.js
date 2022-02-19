/* eslint-disable no-multi-spaces */
/* eslint-disable no-inline-comments */
/* eslint-disable line-comment-position */



import { Cluster, ExtendedWorker } from '../src/multithread.js';

/* Worker Test */ ( async () => {

    const worker = ExtendedWorker.new( async () => {
        _.compute( arg => arg * 10 );
    } );

    console.log( await worker.compute( 10 ) );

} )();


/* Cluster Test */ ( async () => {

    console.log( Cluster.DEFAULT_SIZE );

    const cluster = Cluster.new( () => {
        _.run( arg => arg * 10 );
    } );

    console.log( await cluster.run( 8 ) );                      // Await for all the result of the computation of the same argument.
    console.log( await cluster.$run( 8 ) );                     // Await for the first result of the computation of the same argument.
    console.log( await cluster._run( [ 8, 9, 10, 11 ] ) );      // Await for all the result of the computation of the different arguments.
    console.log( await cluster.$_run( [ 8, 9, 10, 11 ] ) );     // Await for the first result of the computation of the different arguments.

} )();
