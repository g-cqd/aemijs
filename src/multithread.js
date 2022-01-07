/* eslint-env module */

import { getGlobal, newUID } from './utils.js';

export class ExtendedWorker {

    /**
     * @typedef {Object} ExtendedWorkerOptions
     * @property {Boolean} [promise] - Whether to return a Promise from ExtendedWorker.postMessage
     * @property {String|String[]} [importScripts] - Third-party Scripts to import into the Worker
     * @property {Boolean} [includeHandler] - Whether to include the default ExtendedWorkerHandler in the worker
     * @property {String|String[]} [localImports] - Local Scripts to import into the Worker
     * @property {Boolean} [uglify] - Wrap your function in importScripts
     * @property {"include"|"omit"|"same-origin"} [credentials] - Whether to send credentials with requests
     * @property {String} [name] - Name of the worker
     * @property {"classic"|"module"} [type] - Type of the worker
     */

    /**
     * @param {Function|String} WorkerObject - Function or Worker file URL from which to create an ExtendedWorker
     * @param {ExtendedWorkerOptions} [WorkerOptions] - Options to configure ExtendedWorker
     */
    constructor( WorkerObject, WorkerOptions ) {
        if ( typeof WorkerObject === 'function' ) {
            WorkerObject = ExtendedWorker.prepareFromFunction( WorkerObject, WorkerOptions );
        }
        this.worker = new Worker( WorkerObject, WorkerOptions );
        if ( WorkerOptions && 'promise' in WorkerOptions && WorkerOptions.promise === true ) {
            this.worker.promise = true;
            ExtendedWorker.assert();
            this.worker.onmessage = ExtendedWorker.onMessage;
        }
        else {
            this.worker.promise = false;
        }
    }

    /**
     * Return a Worker-ready ObjectURL from a specified function string
     * @param {String} WorkerString - Function string from which to create ExtendedWorker
     * @param {{
     *   promise?:Boolean,
     *   importScripts?:String|String[],
     *   localImports?:String|String[],
     *   uglify?:Boolean
     * }} [WorkerOptions] - Options to configure ExtendedWorker
     * @returns {String} ObjectURL from Function String
     */
    static prepareFromString( WorkerString, WorkerOptions ) {
        const scripts = [];
        if ( typeof WorkerOptions === 'object' ) {
            if ( 'localImports' in WorkerOptions ) {
                if ( typeof WorkerOptions.localImports === 'string' ) {
                    scripts.push( `${ window.location.origin }${ WorkerOptions.localImports }` );
                }
                else {
                    scripts.push( ...WorkerOptions.localImports.map( path => `${ window.location.origin }${ path }` ) );
                }
            }
            if ( 'importScripts' in WorkerOptions ) {
                if ( typeof WorkerOptions.importScripts === 'string' ) {
                    scripts.push( WorkerOptions.importScripts );
                }
                else {
                    scripts.push( ...WorkerOptions.importScripts );
                }
            }
            if ( 'includeHandler' in WorkerOptions && WorkerOptions.includeHandler === true ) {
                scripts.push( `data:application/javascript;base64,${ btoa( `(${ ExtendedWorker.getExtendedWorkerHandler().toString() })();` ) }` );
            }
        }
        if ( typeof WorkerString === 'string' ) {
            let WorkerBody;
            if ( 'uglify' in WorkerOptions && WorkerOptions.uglify === true ) {
                const _WorkerString = `(${ WorkerString })();`;
                const _dataURL = `data:application/javascript;base64,${ btoa( _WorkerString ) }`;
                scripts.push( _dataURL );
                WorkerBody = `importScripts('${ scripts.join( "', '" ) }');`;
            }
            else {
                WorkerBody = `${ scripts.length > 0 ? `importScripts('${ scripts.join( "','" ) }');\n` : '' }(${ WorkerString })();`;
            }
            const WorkerBlob = new Blob( [ WorkerBody ], { type: 'text/javascript' } );
            return URL.createObjectURL( WorkerBlob );
        }
        throw new Error( `WorkerString:${ WorkerString } is not a string.` );
    }

    /**
     * Return a Worker-ready ObjectURL from a specified function
     * @param {String} WorkerString - Function from which to create ExtendedWorker
     * @param {{
     *   promise?:Boolean,
     *   includeHandler?:Boolean,
     *   importScripts?:String|String[],
     *   localImports?:String|String[],
     *   uglify?:Boolean
     * }} [WorkerOptions] - Options to configure ExtendedWorker
     * @returns {String} ObjectURL from Function
     */
    static prepareFromFunction( WorkerFunction, WorkerOptions ) {
        if ( typeof WorkerFunction === 'function' ) {
            return ExtendedWorker.prepareFromString( WorkerFunction.toString(), WorkerOptions );
        }
        throw new Error( `WorkerFunction:${ WorkerFunction } is not a function.` );
    }

    /**
     * Create an ExtendedWorker from a specified function string
     * @param {String} WorkerString - Function string from which to create ExtendedWorker
     * @param {{
     *   promise?:Boolean,
     *   importScripts?:String|String[],
     *   includeHandler?:Boolean,
     *   localImports?:String|String[],
     *   uglify?:Boolean
     * }} [WorkerOptions] - Options to configure ExtendedWorker
     * @returns {ExtendedWorker} ExtendedWorker from function string
     */
    static createFromString( WorkerString, WorkerOptions ) {
        const scripts = [];
        if ( typeof WorkerOptions === 'object' ) {
            if ( 'localImports' in WorkerOptions ) {
                if ( typeof WorkerOptions.localImports === 'string' ) {
                    scripts.push( `${ window.location.origin }${ WorkerOptions.localImports }` );
                }
                else {
                    scripts.push( ...WorkerOptions.localImports.map( path => `${ window.location.origin }${ path }` ) );
                }
            }
            if ( 'importScripts' in WorkerOptions ) {
                if ( typeof WorkerOptions.importScripts === 'string' ) {
                    scripts.push( WorkerOptions.importScripts );
                }
                else if ( Array.isArray( WorkerOptions.importScripts ) ) {
                    scripts.push( ...WorkerOptions.importScripts );
                }
            }
            if ( 'includeHandler' in WorkerOptions && WorkerOptions.includeHandler === true ) {
                scripts.push( `data:application/javascript;base64,${ btoa( `(${ ExtendedWorker.getExtendedWorkerHandler().toString() })();` ) }` );
            }
        }
        if ( typeof WorkerString === 'string' ) {
            let WorkerBody;
            if ( 'uglify' in WorkerOptions && WorkerOptions.uglify === true ) {
                const _WorkerString = `(${ WorkerString })();`;
                const _dataURL = `data:application/javascript;base64,${ btoa( _WorkerString ) }`;
                scripts.push( _dataURL );
                WorkerBody = `importScripts('${ scripts.join( "', '" ) }');`;
            }
            else {
                WorkerBody = `${ scripts.length > 0 ? `importScripts('${ scripts.join( "','" ) }');\n` : '' }(${ WorkerString })();`;
            }
            const WorkerBlob = new Blob( [ WorkerBody ], { type: 'text/javascript' } );
            return new ExtendedWorker( URL.createObjectURL( WorkerBlob ), WorkerOptions );
        }
        throw new Error( `WorkerString:${ WorkerString } is not a string.` );
    }

    /**
     * Create an ExtendedWorker from a specified function
     * @param {Function} WorkerFunction - Function from which to create ExtendedWorker
     * @param {{
     *   promise?:Boolean,
     *   includeHandler?:Boolean,
     *   importScripts?:String|String[],
     *   localImports?:String|String[]
     * }} [WorkerOptions] - Options to configure ExtendedWorker
     * @returns {ExtendedWorker} ExtendedWorker from function
     */
    static createFromFunction( WorkerFunction, WorkerOptions ) {
        if ( typeof WorkerFunction === 'function' ) {
            return ExtendedWorker.createFromString( WorkerFunction.toString(), WorkerOptions );
        }
        throw new Error( `WorkerFunction:${ WorkerFunction } is not a function.` );
    }

    set onmessage( func ) {
        this.worker.onmessage = func;
    }

    get onmessage() {
        return this.worker.onmessage;
    }

    set onerror( func ) {
        this.worker.onerror = func;
    }

    get onerror() {
        return this.worker.onerror;
    }

    set onmessageerror( func ) {
        this.worker.onmessageerror = func;
    }

    get onmessageerror() {
        return this.worker.onmessageerror;
    }

    /**
     * @param {Event} event
     * @returns {Boolean}
     */
    dispatchEvent( event ) {
        return this.worker.dispatchEvent( event );
    }

    /**
     * Add event listener in target's event listener list
     * @param {any} type
     * @param {(ev:any).any} listener
     * @param {boolean|AddEventListenerOptions} [options]
     */
    addEventListener( type, listener, options ) {
        return this.worker.addEventListener( type, listener, options );
    }

    /**
     * Removes the event listener in target's event listener list with the same type, callback, and options.
     * @param {any} type
     * @param {(ev:any).any} listener
     * @param {boolean|EventListenerOptions} [options]
     */
    removeEventListener( type, listener, options ) {
        this.worker.removeEventListener( type, listener, options );
    }

    terminate() {
        this.worker.terminate();
    }

    /**
     * Post message to Worker
     * @param {any} message - Message to pass to Worker
     * @param {Transferable[]} [transfer] - Transferable Object List to pass to Worker
     * @returns {void|Promise}
     */
    postMessage( message, transfer ) {
        return ExtendedWorker.postMessage( [ message, transfer ], this.worker );
    }

    /**
     * Ensure globalThis variable can handle ExtendedWorker promises
     * @returns {{resolves:{[String]:Function},rejects:{[String]:Function}}}
     */
    static assert() {
        const self = getGlobal();
        if ( !( 'ExtendedWorkers' in self ) ) {
            self.ExtendedWorkers = { resolves: {}, rejects: {} };
        }
        else if ( !( 'resolves' in self.ExtendedWorkers && 'rejects' in self.ExtendedWorkers ) ) {
            self.ExtendedWorkers.resolves = {};
            self.ExtendedWorkers.rejects = {};
        }
        return self.ExtendedWorkers;
    }

    /**
     * Post Message to Worker within an ExtendedWorker
     * @param {[message:any,transfer?:Transferable[]]} messagePayload - Message Payload to pass through Worker.postMessage
     * @param {Worker} worker - Worker to which post messagePayload
     * @returns {void|Promise}
     */
    static postMessage( messagePayload, worker ) {
        if ( worker.promise ) {
            const messageId = newUID();
            const [ message, transfer ] = messagePayload;
            const payload = { id: messageId, data: message };
            return new Promise( ( resolve, reject ) => {
                ExtendedWorker.resolves[messageId] = resolve;
                ExtendedWorker.rejects[messageId] = reject;
                if ( transfer ) {
                    worker.postMessage( payload, transfer );
                }
                else {
                    worker.postMessage( payload );
                }
            } );
        }
        worker.postMessage( ...messagePayload );

    }

    /**
     * ExtendedWorker Message Reception Handling
     * @param {MessageEvent} message - Message received by a Worker
     * @returns {void}
     */
    static onMessage( message ) {
        const { id, err, data } = message.data;
        const resolve = ExtendedWorker.resolves[id];
        const reject = ExtendedWorker.rejects[id];
        if ( !err ) {
            if ( resolve ) {
                resolve( data );
            }
        }
        else if ( reject ) {
            if ( err ) {
                reject( err );
            }
        }
        ExtendedWorker.delete( id );
    }

    /**
     * @returns {{[String]:Function}}
     */
    static get resolves() {
        return ExtendedWorker.assert().resolves;
    }

    /**
     * @returns {{[String]:Function}}
     */
    static get rejects() {
        return ExtendedWorker.assert().rejects;
    }

    /**
     * @param {String} id - Unique messageId
     * @returns {void}
     */
    static delete( id ) {
        delete ExtendedWorker.resolves[id];
        delete ExtendedWorker.rejects[id];
    }

    static getExtendedWorkerHandler() {
        return function extendedWorkerHandler() {
            /* eslint-env browser,worker */

            ( globalThis || self || window ).listeners = new class ExtenderWorkerHandler {

                constructor() {
                    this.typeListeners = {};
                    this.addTypeListener( 'default', value => value );
                    this.self.onmessage = messageEvent => {
                        this.listen( messageEvent );
                    };
                }

                /**
                 * @returns {globalThis}
                 */
                // eslint-disable-next-line class-methods-use-this
                get self() {
                    return globalThis;
                }

                /**
                 * @param {MessageEvent} messageEvent
                 * @returns {void}
                 */
                listen( messageEvent ) {
                    const { id, data } = messageEvent.data;
                    if ( typeof data === 'object' && 'type' in data ) {
                        if ( data.type in this.typeListeners ) {
                            this.typeListeners[data.type]( id, data, messageEvent );
                        }
                        else {
                            this.typeListeners.default( id, data, messageEvent );
                        }
                    }
                    else {
                        this.typeListeners.default( id, data, messageEvent );
                    }
                }

                /**
                 * @param {String} type - Message Type to look for when receiving a message
                 * @param {Function} func - Message Handler to call
                 * @param {{
                 *   keepMessageEvent:Boolean,
                 *   propertyAccessor:String
                 * }} [options] - Options used to parse message data
                 * @returns {void}
                 */
                addTypeListener( type, func, options = {} ) {
                    const { keepMessageEvent, propertyAccessor } = options;
                    this.typeListeners[type] = ( id, data, messageEvent ) => {
                        const _data = propertyAccessor ? data[propertyAccessor] : data;
                        const _args = keepMessageEvent ? [ messageEvent, _data ] : [ _data ];
                        const _value = func( ..._args );
                        if ( _value instanceof Promise ) {
                            _value.then( value => {
                                this.self.postMessage( { id, data: value } );
                            } ).catch( console.error );
                        }
                        else {
                            this.self.postMessage( { id, data: _value } );
                        }
                    };
                }

            }();

        };
    }

}

export default { ExtendedWorker };
