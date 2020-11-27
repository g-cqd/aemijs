import { AemiLoading } from './aemi.js';

const { Wait } = AemiLoading;

Wait.interactive( function () {
    console.info( 'Page is now interactive.' );
} );