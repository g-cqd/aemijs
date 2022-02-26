/* eslint-disable no-multi-spaces */
/* eslint-disable line-comment-position */
/* eslint-disable no-inline-comments */
const { ExtendedCluster, ExtendedWorker } = require( '../src/multithread' );

const _ = {};

/* Worker Test */ ( async () => {

    const worker = ExtendedWorker.new( () => _.run( arg => arg * 10 ) );

    console.log( await worker.run( 10 ) );

} )();


/* Cluster Test */ ( async () => {

    const batch = ExtendedCluster.new( () => _.run( arg => arg * 10 ) );

    console.log( await batch.run( 8 ) );                  // Await for all the result of the computation of the same argument.
    console.log( await batch.$run( 8 ) );                 // Await for the first result of the computation of the same argument.
    console.log( await batch._run( [ 8, 9, 10, 11 ] ) );  // Await for all the result of the computation of the different arguments.
    console.log( await batch.$_run( [ 8, 9, 10, 11 ] ) ); // Await for the first result of the computation of the different arguments.

} )();
