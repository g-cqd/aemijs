/* eslint-env module */

import { ExtendedWorker } from './multithread.js';
import { WebPTest } from './navigator.js';
import { getGlobal } from './utils.js';

export class Wait {

    /**
     * @typedef {Object} WaitRegister
     * @property {Array<Function>} DOMContentLoaded
     * @property {Array<Function>} interactive
     * @property {Array<Function>} complete
     * @property {Array<Function>} load
     */
    /**
     * @typedef {'DOMContentLoaded'|'interactive'|'complete'|'load'} WaitRegisterType
     */
    /**
     * @returns {WaitRegister}
     */
    static register() {
        const gl = getGlobal();
        if ( typeof gl.WaitRegister === 'undefined' ) {
            gl.WaitRegister = {
                interactive: [],
                complete: [],
                DOMContentLoaded: [],
                load: []
            };
            document.addEventListener( 'readystatechange', () => Wait.all( document.readyState ) );
            document.addEventListener( 'DOMContentLoaded', () => Wait.all( 'DOMContentLoaded' ) );
            window.addEventListener( 'load', () => Wait.all( 'load' ) );
        }
        return gl.WaitRegister;
    }

    /**
     * @typedef {Object} WaitRegisterOptions
     * @property {Function} resolve
     * @property {Function} reject
     * @property {Function} func
     * @property {any[]} args
     */

    /**
     * @param {string} type - Register an action to be fired when type is dispatched
     * @param {WaitRegisterOptions} options - Functions and args to call when action will be fired
     */
    static set( type, options ) {
        const { resolve, reject, func, args } = options;
        const registry = Wait.register();
        let exec = false;
        const { readyState } = document;
        switch ( type ) {
            case 'interactive':
            case 'DOMContentLoaded': {
                if ( readyState !== 'loading' ) {
                    exec = true;
                    try {
                        resolve( func( ...args ) );
                    }
                    catch ( _ ) {
                        reject( _ );
                    }
                }
                break;
            }
            case 'complete':
            case 'load': {
                if ( readyState === 'complete' ) {
                    exec = true;
                    try {
                        resolve( func( ...args ) );
                    }
                    catch ( _ ) {
                        reject( _ );
                    }
                }
                break;
            }
            default: {
                break;
            }
        }
        if ( exec === false ) {
            registry[type].push( () => new Promise( ( resolve_, reject_ ) => {
                try {
                    return resolve_( resolve( func( ...args ) ) );
                }
                catch ( _ ) {
                    reject_( reject( _ ) );
                }
            } ) );
        }
    }

    /**
     * @param {WaitRegisterType} type - EventType or Key to wait to be dispatched or already registered
     * @returns {Promise<any[]>} Wrap every function of a type in a Promise.all and return the result
     */
    static all( type ) {
        return Promise.all( Wait.register()[type].map( f => f() ) );
    }

    /**
     * @param {Number} time - Time to wait before resolving
     * @returns {Promise<Number>} Resolve after time
     */
    static time( time ) {
        return new Promise( resolve => setTimeout( resolve, time ) );
    }

    /**
     *
     * @param {Function} func - Function to wrap in a setTimeout function
     * @param {Number} timeout - timeout parameter for setTimeout
     * @param  {...any} funcArgs - Arguments to pass to func function
     * @returns {Number} Timeout ID
     */
    static delay( func, timeout, ...funcArgs ) {
        return setTimeout( func, timeout || 0, ...funcArgs );
    }

    /**
     *
     * @param {Function} func - Function to wrap in a Promise
     * @param  {...any} funcArgs - Arguments to pass to function
     * @returns {Promise} Asynchronous wrapped function
     */
    static async( func, ...funcArgs ) {
        return new Promise( ( resolve, reject ) => {
            try {
                resolve( func( ...funcArgs ) );
            }
            catch ( _ ) {
                reject( _ );
            }
        } );
    }

    /**
     *
     * @param {Function} func - Function to wrap in an asynchronous timeout
     * @param {Number} timeout - Timeout to wait before calling func
     * @param  {...any} funcArgs - Arguments to pass to func
     * @returns {Promise} Asynchronous wrapped function
     */
    static promiseDelay( func, timeout, ...funcArgs ) {
        return new Promise( ( resolve, reject ) => setTimeout( ( ...args ) => {
            try {
                return resolve( func( ...args ) );
            }
            catch ( _ ) {
                return reject( _ );
            }
        }, timeout, ...funcArgs ) );
    }

    /**
     *
     * @param {Function} func - Function to trigger when interactive event is fired
     * @param  {...any} funcArgs - Arguments to pass to function
     * @returns {Promise} Asynchronous wrapped function
     */
    static interactive( func, ...funcArgs ) {
        return new Promise( ( resolve, reject ) => {
            Wait.set( 'interactive', { resolve, reject, func, args: funcArgs } );
        } );
    }

    /**
     *
     * @param {Function} func - Function to trigger when readyState changes to complete
     * @param  {...any} funcArgs - Arguments to pass to function
     * @returns {Promise} Asynchronous wrapped function
     */
    static complete( func, ...funcArgs ) {
        return new Promise( ( resolve, reject ) => {
            Wait.set( 'complete', { resolve, reject, func, args: funcArgs } );
        } );
    }

    /**
     *
     * @param {Function} func - Function to trigger when DOMContentLoaded event is fired
     * @param  {...any} funcArgs - Arguments to pass to function
     * @returns {Promise} Asynchronous wrapped function
     */
    static DOMContentLoaded( func, ...funcArgs ) {
        return new Promise( ( resolve, reject ) => {
            Wait.set( 'DOMContentLoaded', { resolve, reject, func, args: funcArgs } );
        } );
    }

    /**
     *
     * @param {Function} func - Function to trigger when readyState changes to complete
     * @param  {...any} funcArgs - Arguments to pass to function
     * @returns {Promise} Asynchronous wrapped function
     */
    static ready( func, ...funcArgs ) {
        return new Promise( ( resolve, reject ) => {
            Wait.set( 'complete', { resolve, reject, func, args: funcArgs } );
        } );
    }

    /**
     *
     * @param {Function} func - Function to trigger when window.load event is fired
     * @param  {...any} funcArgs - Arguments to pass to function
     * @returns {Promise} Asynchronous wrapped function
     */
    static load( func, ...funcArgs ) {
        return new Promise( ( resolve, reject ) => {
            Wait.set( 'complete', { resolve, reject, func, args: funcArgs } );
        } );
    }

}

export class ImageLoader {

    constructor() {
        this.worker = new ExtendedWorker(
            () => {
                self.onmessage = function onmessage( event ) {
                    url( event.data.data.url, event.data.id ).then(
                        ( [ id, result ] ) => {
                            self.postMessage( {
                                id,
                                data: { url: result || '' }
                            } );
                        }
                    );
                };
                function url( url, id, options ) {
                    options = !!options && typeof options === 'object' ? options : Object.create( null );
                    return new Promise( async ( resolve, reject ) => {
                        fetch( url, {
                            method: 'GET',
                            mode: 'cors',
                            credentials: 'include',
                            cache: 'default',
                            ...options
                        } ).then( async response => {
                            if ( response.status === 200 ) {
                                try {
                                    const blob = await response.blob();
                                    return resolve( [ id, URL.createObjectURL( blob ) ] );
                                }
                                catch ( _ ) {
                                    console.error( _ );
                                    return reject( [ id, '' ] );
                                }
                            }
                            console.error( response );
                            return reject( [ id, '' ] );
                        } )
                            .catch( _ => {
                                console.error( _ );
                                return reject( [ id, '' ] );
                            } );
                    } );
                }
            },
            { promise: true }
        );
    }

    async load( options = {} ) {
        const { src, webp } = options;
        let res;
        if ( !!webp && typeof webp === 'string' ) {
            const _ = await WebPTest.passed;
            if ( _ ) {
                res = ( await this.worker.postMessage( { url: webp } ) ).url;
            }
            else {
                res = ( await this.worker.postMessage( { url: src } ) ).url;
            }
        }
        else {
            res = ( await this.worker.postMessage( { url: src } ) ).url;
        }
        return res;
    }

    static async load( options ) {
        const gl = getGlobal();
        if ( !( 'ImageLoader' in gl ) ) {
            gl.ImageLoader = new ImageLoader();
        }
        return await gl.ImageLoader.load( options );
    }

    terminate() {
        this.worker.terminate();
    }

    static terminate() {
        const gl = getGlobal();
        if ( 'ImageLoader' in gl ) {
            gl.ImageLoader.terminate();
            delete gl.ImageLoader;
        }
    }

}

export default { ImageLoader, Wait };
