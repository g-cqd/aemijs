/* eslint-env browser */

console.log( globalThis );

if ( typeof document !== 'undefined' ) {
    const worker = new ExtendedWorker( function () {
        
    }, {
        promise: true,
        name: 'super-worker',
        importScripts: [
            document.currentScript.baseURI + 'aemi.min.js',
            document.currentScript.src
        ]
    } );
}
