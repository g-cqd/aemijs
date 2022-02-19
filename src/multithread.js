/* eslint-env module */

import { getLastPath, isWorker, removeStartingSlash } from './utils.js';

export class ExtendedWorkerHandler {

    /**
     * @typedef {Object} ExtendedWorkerListenerOptions
     * @property {boolean} keepMessageEvent
     * @property {string} propertyAccessor
     */

    /**
     * @typedef {ExtendedWorkerHandler & Proxy} ExtendedWorkerHandlerProxy
     */

    constructor() {
        this.typeListeners = {};
        this.addTypeListener( 'default', value => value );
        this.self.onmessage = message => this.listen( message );
        this.self._ = this.proxy;
    }

    /**
     * @returns {globalThis}
     */
    // eslint-disable-next-line class-methods-use-this
    get self() {
        return globalThis || window;
    }

    /**
     * @returns {ExtendedWorkerHandlerProxy}
     */
    get proxy() {
        return new Proxy( this, {
            get: ( target, property ) => {
                if ( property in target ) {
                    return target[property];
                }
                return ( func, options ) => target.addTypeListener( property, func, options || { propertyAccessor: 'data' } );
            }
        } );
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
     * @param {ExtendedWorkerListenerOptions} [options] - Options used to parse message data
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

}


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
     * @typedef {Object} ExtendedWorkerPromiseManager
     * @property {Object.<string,Function>} resolves
     * @property {Object.<string,Function>} rejects
     * @property {number} instances
     */

    /**
     * @typedef {ExtendedWorker & Proxy} ExtendedWorkerProxy
     */

    /**
     * @typedef {[any,Transferable[]?]} WorkerMessagePayload
     */

    static {
        this.resolves = {};
        this.rejects = {};
        this.instances = 0;
    }

    /**
     * @returns {number}
     */
    static get id() {
        return ExtendedWorker.instances++;
    }

    /**
     * Post Message to Worker within an ExtendedWorker
     * @param {WorkerMessagePayload} messagePayload - Message Payload to pass through Worker.postMessage
     * @param {ExtendedWorker} worker - Worker to which post messagePayload
     * @returns {void|Promise}
     */
    static postMessage( messagePayload, extendedWorker ) {
        const { worker, promise, id, usages } = extendedWorker;
        if ( promise ) {
            const messageId = `${ id }::${ usages }`;
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
     * @param {string} id - Unique messageId
     * @returns {void}
     */
    static delete( id ) {
        delete ExtendedWorker.resolves[id];
        delete ExtendedWorker.rejects[id];
    }

    /**
     * @returns {ExtendedWorkerHandler}
     */
    static get Handler() {
        return ExtendedWorkerHandler;
    }

    /**
     * @returns {string}
     */
    static get WrappedHandler() {
        return `()=>(globalThis||self||window).listeners=new (${ ExtendedWorker.Handler.toString() })();`;
    }

    /**
     * Encapsulate a function in a blob to be used as Worker code
     *
     * @param {string} data - Data to be sent to the Worker
     * @returns {string}
     */
    static toObjectURL( data ) {
        return URL.createObjectURL( new Blob( [ data ], { type: 'application/javascript' } ) );
    }

    /**
     * @param {ExtendedWorkerOptions} WorkerOptions
     * @returns {string[]}
     */
    static _parseLocalScriptsImports( WorkerOptions = {} ) {
        const scripts = [];
        if ( 'localImports' in WorkerOptions ) {
            const { localImports: imports } = WorkerOptions;
            if ( typeof imports === 'string' ) {
                scripts.push( `${ window.location.origin }/${ removeStartingSlash( imports ) }` );
            }
            else if ( Array.isArray( scripts ) ) {
                scripts.push( ...scripts.map( path => `${ window.location.origin }/${ removeStartingSlash( path ) }` ) );
            }
            else {
                throw new Error( 'WorkerOptions.localImports is not correctly defined.' );
            }
        }
        return scripts;
    }

    /**
     * @param {ExtendedWorkerOptions} WorkerOptions
     */
    static _parseImportScripts( WorkerOptions = {} ) {
        const scripts = [];
        if ( 'importScripts' in WorkerOptions ) {
            const { importScripts: imports } = WorkerOptions;
            if ( typeof imports === 'string' ) {
                scripts.push( imports );
            }
            else if ( Array.isArray( imports ) ) {
                scripts.push( ...imports );
            }
            else {
                throw new Error( 'WorkerOptions.importScripts is not correctly defined.' );
            }
        }
        return scripts;
    }

    /**
     * @param {ExtendedWorkerOptions} WorkerOptions
     */
    static _parseLocalModuleImports( WorkerOptions = {} ) {
        const modules = [];
        if ( 'localImports' in WorkerOptions ) {
            const { localImports: imports } = WorkerOptions;
            if ( typeof imports === 'string' ) {
                modules.push( `import ${ getLastPath( imports ) } from '${ window.location.origin }/${ imports }';` );
            }
            else if ( Array.isArray( imports ) ) {
                for ( const _import of imports ) {
                    if ( typeof _import === 'string' ) {
                        modules.push( `import ${ getLastPath( _import ) } from '${ window.location.origin }/${ removeStartingSlash( _import ) }';` );
                    }
                    else if ( typeof _import === 'object' ) {
                        if ( !( ( 'objects' in _import || '*' in _import || 'name' in _import ) && 'path' in _import ) ) {
                            throw new Error( 'WorkerOptions.importScripts is not correctly defined.' );
                        }
                        const { objects, '*': _as, name, path } = _import;
                        if ( name ) {
                            modules.push( `import ${ name } from '${ window.location.origin }/${ removeStartingSlash( path ) }';` );
                        }
                        else if ( _as ) {
                            modules.push(
                                `import ${ objects ?
                                    typeof objects === 'string' ?
                                        `{ ${ objects } },` :
                                        `{ ${ objects.join( ',' ) } }, ` :
                                    ''
                                }* as ${ _as } from '${ window.location.origin }/${ removeStartingSlash( path ) }';`
                            );
                        }
                        else if ( objects ) {
                            modules.push(
                                `import ${ objects ?
                                    typeof objects === 'string' ?
                                        `{ ${ objects } },` :
                                        `{ ${ objects.join( ',' ) } } ` :
                                    ''
                                } from '${ window.location.origin }/${ removeStartingSlash( path ) }';`
                            );
                        }
                        else {
                            throw new Error( 'WorkerOptions.importScripts is not correctly defined.' );
                        }
                    }
                }
            }
            else {
                throw new Error( 'WorkerOptions.localImports is not correctly defined.' );
            }
        }
        if ( 'includeHandler' in WorkerOptions && WorkerOptions.includeHandler === true ) {
            modules.push( `import multithread from '${ window.location.origin }/src/multithread.js';` );
        }
        return modules;
    }

    /**
     * @param {ExtendedWorkerOptions} WorkerOptions
     */
    static _parseImportModuleScripts( WorkerOptions = {} ) {
        const modules = [];
        if ( 'importScripts' in WorkerOptions ) {
            const { importScripts: imports } = WorkerOptions;
            if ( typeof imports === 'string' ) {
                modules.push( `import ${ getLastPath( imports ) } from '${ imports }';` );
            }
            else if ( Array.isArray( imports ) ) {
                for ( const _import of imports ) {
                    if ( typeof _import === 'string' ) {
                        modules.push( `import ${ getLastPath( _import ) } from '${ _import }';` );
                    }
                    else if ( typeof _import === 'object' ) {
                        if ( !( ( 'objects' in _import || '*' in _import || 'name' in _import ) && 'path' in _import ) ) {
                            throw new Error( 'WorkerOptions.importScripts is not correctly defined.' );
                        }
                        const { objects, '*': _as, name, path } = _import;
                        if ( name ) {
                            modules.push( `import ${ name } from '${ path }';` );
                        }
                        else if ( _as ) {
                            modules.push(
                                `import ${ objects ?
                                    typeof objects === 'string' ?
                                        `{ ${ objects } },` :
                                        `{ ${ objects.join( ',' ) } }, ` :
                                    ''
                                }* as ${ _as } from '${ path }';`
                            );
                        }
                        else if ( objects ) {
                            modules.push(
                                `import ${ objects ?
                                    typeof objects === 'string' ?
                                        `{ ${ objects } },` :
                                        `{ ${ objects.join( ',' ) } } ` :
                                    ''
                                } from '${ path }';`
                            );
                        }
                        else {
                            throw new Error( 'WorkerOptions.importScripts is not correctly defined.' );
                        }
                    }
                }
            }
            else {
                throw new Error( 'WorkerOptions.importScripts is not correctly defined.' );
            }
        }
        return modules;
    }

    static _exportHandlerToScriptImport() {
        return ExtendedWorker.toObjectURL( `(${ ExtendedWorker.WrappedHandler })();` );
    }

    /**
     * @param {string} WorkerString
     */
    static _uglifyWorkerToScript( WorkerString ) {
        if ( typeof WorkerString === 'string' ) {
            return ExtendedWorker.toObjectURL( WorkerString );
        }
        throw new Error( 'WorkerString is not a string.' );
    }

    /**
     * @param {string} WorkerString
     * @param {ExtendedWorkerOptions} WorkerOptions
     * @returns {string}
     */
    static _craftScriptForModuleImport( WorkerString, WorkerOptions = {} ) {
        if ( typeof WorkerString !== 'string' ) {
            throw new Error( 'WorkerString is not a string.' );
        }
        const modules = [
            ...ExtendedWorker._parseLocalModuleImports( WorkerOptions ),
            ...ExtendedWorker._parseImportModuleScripts( WorkerOptions )
        ];
        let WorkerBody;
        if ( 'uglify' in WorkerOptions && WorkerOptions.uglify === true ) {
            throw new Error( 'WorkerOptions.uglify can not be applied to module worker.' );
        }
        else {
            WorkerBody = `${ modules.length > 0 ? `${ modules.join( '\n' ) }\n` : '' }(${ WorkerString })();`;
        }
        return ExtendedWorker.toObjectURL( WorkerBody );
    }

    /**
     * @param {string} WorkerString
     * @param {ExtendedWorkerOptions} WorkerOptions
     * @returns {string}
     */
    static _craftScriptForScriptImport( WorkerString, WorkerOptions = {} ) {
        if ( typeof WorkerString !== 'string' ) {
            throw new Error( 'WorkerString is not a string.' );
        }
        const scripts = [
            ...ExtendedWorker._parseLocalScriptsImports( WorkerOptions ),
            ...ExtendedWorker._parseImportScripts( WorkerOptions )
        ];
        if ( 'includeHandler' in WorkerOptions && WorkerOptions.includeHandler === true ) {
            scripts.push( ExtendedWorker._exportHandlerToScriptImport() );
        }
        let WorkerBody;
        if ( 'uglify' in WorkerOptions && WorkerOptions.uglify === true ) {
            scripts.push( ExtendedWorker._uglifyWorkerToScript( WorkerString ) );
            WorkerBody = `importScripts("${ scripts.join( '","' ) }");`;
        }
        else {
            WorkerBody = `${ scripts.length > 0 ? `importScripts("${ scripts.join( '","' ) }");\n` : '' }(${ WorkerString })();`;
        }
        return ExtendedWorker.toObjectURL( WorkerBody );

    }

    /**
     * @param {string} WorkerString
     * @param {ExtendedWorkerOptions} WorkerOptions
     * @returns {string}
     */
    static createObjectURL( WorkerString = '', WorkerOptions = {} ) {
        if ( typeof WorkerOptions === 'object' ) {
            if ( 'type' in WorkerOptions && WorkerOptions.type === 'module' ) {
                return ExtendedWorker._craftScriptForModuleImport( WorkerString, WorkerOptions );
            }
            else if ( 'type' in WorkerOptions && !( WorkerOptions.type === 'module' || WorkerOptions.type === 'classic' ) ) {
                throw new Error( `WorkerOptions.type:${ WorkerOptions.type } is not a valid type.` );
            }
            else {
                return ExtendedWorker._craftScriptForScriptImport( WorkerString, WorkerOptions );
            }
        }
        else if ( typeof WorkerString === 'string' ) {
            return ExtendedWorker.toObjectURL( WorkerString );
        }
        throw new Error( 'WorkerString is not a string.' );
    }

    /**
     * Return a proxied ExtendedWorker
     *
     * The proxied ExtendedWorker is by default a module worker set to receive promise-based messages and managed through an builtin handler
     *
     * @param {string|Function} WorkerObject
     * @param {ExtendedWorkerOptions} WorkerOptions
     * @returns {ExtendedWorkerProxy}
     */
    static new( WorkerObject, WorkerOptions = {} ) {
        return new ExtendedWorker( WorkerObject, { promise: true, type: 'module', includeHandler: true, ...WorkerOptions } ).proxy;
    }

    /**
     * Run a single function in a worker and terminate the worker once the function has been executed
     *
     * @param {string|Function} func
     * @param {...any} args
     */
    static async run( func, data, transferable ) {
        const worker = ExtendedWorker.new( `async()=>_.run(${ func })` );
        const result = await worker.run( data, transferable );
        worker.terminate();
        return result;
    }

    /**
     * @param {string|Function} WorkerObject
     * @param {ExtendedWorkerOptions} WorkerOptions
     */
    constructor( WorkerObject, WorkerOptions ) {
        let _workerObject;
        if ( typeof WorkerObject === 'function' ) {
            _workerObject = ExtendedWorker.createObjectURL( WorkerObject.toString(), WorkerOptions );
        }
        else if ( typeof WorkerObject === 'string' ) {
            _workerObject = ExtendedWorker.createObjectURL( WorkerObject, WorkerOptions );
        }
        else {
            throw new Error( 'WorkerObject is not a string or a function.' );
        }
        Object.defineProperty( this, 'worker', { value: new Worker( _workerObject, WorkerOptions ) } );
        Object.defineProperty( this, 'promise', { value: WorkerOptions && WorkerOptions.promise } );
        this._usages = 0;
        if ( WorkerOptions && 'promise' in WorkerOptions && WorkerOptions.promise === true ) {
            Object.defineProperty( this, 'id', { value: ExtendedWorker.id } );
            this.worker.onmessage = ExtendedWorker.onMessage;
        }
    }

    /**
     * @returns {number}
     */
    get usages() {
        return this._usages++;
    }

    /**
     * @returns {ExtendedWorkerProxy}
     */
    get proxy() {
        return new Proxy( this, {
            get: ( target, property ) => {
                if ( property in target ) {
                    return target[property];
                }
                return ( data, transferable ) => target.postMessage( { type: property, data }, transferable );
            }
        } );
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
        return ExtendedWorker.postMessage( [ message, transfer ], this );
    }

}

export class Cluster {

    /**
     * @typedef {Object} ClusterOptions
     * @property {number} [size=4] - Number of Workers to spawn
     */

    /**
     * @typedef {Object} ClusterExecutionMode
     * @property {boolean} race
     * @property {boolean} spread
     */

    /**
     * @typedef {Object} ClusterMessageOptions
     * @property {ClusterExecutionMode} [mode]
     * @property {any} data
     * @property {Transferable[]} transferable
     */

    /**
     * @typedef {Cluster & Proxy} ClusterProxy
     */

    static {
        this.DEFAULT_SIZE = 4;
    }

    /**
     * Return a proxied Cluster
     *
     * The proxied Cluster is by default a group of 4 module workers set to receive promise-based messages and managed through the builtin handler
     *
     * @param {string|Function} WorkerObject
     * @param {ExtendedWorkerOptions & ClusterOptions} ClusterOptions
     * @returns {ClusterProxy}
     */
    static new( WorkerObject, ClusterOptions = { size: Cluster.DEFAULT_SIZE } ) {
        return new Cluster( WorkerObject, { promise: true, type: 'module', includeHandler: true, ...ClusterOptions } ).proxy;
    }

    /**
     * @param {Function} func
     * @param {any} data
     * @param {Transferable[]} transferable
     */
    static async run( func, data, transferable ) {
        const cluster = Cluster.new( `async()=>_.run(${ func })`, { size: Cluster.DEFAULT_SIZE } );
        const result = await cluster.run( data, transferable );
        cluster.terminate();
        return result;
    }

    /**
     * @param {Function} func
     * @param {any} data
     * @param {Transferable[]} transferable
     */
    static async $run( func, data, transferable ) {
        const cluster = Cluster.new( `async()=>_.run(${ func })`, { size: Cluster.DEFAULT_SIZE } );
        const result = await cluster.$run( data, transferable );
        cluster.terminate();
        return result;
    }

    static async _run( func, data, transferable ) {
        const cluster = Cluster.new( `async()=>_.run(${ func })`, { size: Cluster.DEFAULT_SIZE } );
        const result = await cluster._run( data, transferable );
        cluster.terminate();
        return result;
    }

    /**
     * @param {Function} func
     * @param {any} data
     * @param {Transferable[]} transferable
     */
    // eslint-disable-next-line camelcase
    static async $_run( func, data, transferable ) {
        const cluster = Cluster.new( `async()=>_.run(${ func })`, { size: Cluster.DEFAULT_SIZE } );
        const result = await cluster.$_run( data, transferable );
        cluster.terminate();
        return result;
    }

    /**
     * @param {string|number|Symbol} property
     */
    static parsePropertyDecorator( property ) {
        if ( typeof property === 'string' ) {
            const { groups } = property.match( /^(?<race>\$)?(?<spread>_)?/u );
            const race = Boolean( groups.race );
            const spread = Boolean( groups.spread );
            return {
                modes: { race, spread },
                property: property.slice( race + spread )
            };
        }
        return property;
    }

    /**
     * Cluster of ExtendedWorker
     *
     * @param {string|Function} WorkerObject
     * @param {ExtendedWorkerOptions & ClusterOptions} ClusterOptions
     */
    constructor( WorkerObject, ClusterOptions ) {
        this.workers = [];
        this.size = Cluster.DEFAULT_SIZE;
        if ( typeof ClusterOptions === 'object' && 'size' in ClusterOptions ) {
            this.size = +ClusterOptions.size;
        }
        for ( let i = 0; i < this.size; i++ ) {
            this.workers.push( new ExtendedWorker( WorkerObject, ClusterOptions ) );
        }
    }

    /**
     * @returns {ClusterProxy}
     */
    get proxy() {
        return new Proxy( this, {
            get: ( target, property ) => {
                if ( property in target ) {
                    return target[property];
                }
                const { modes, property: propertyName } = Cluster.parsePropertyDecorator( property );
                return ( data, transferable ) => target.postMessage( { type: propertyName }, undefined, { modes, data, transferable } );
            }
        } );
    }

    /**
     * @param {Event} event
     * @returns {Boolean[]}
     */
    dispatchEvent( event ) {
        return this.workers.map( worker => worker.dispatchEvent( event ) );
    }

    /**
     * Add event listener in target's event listener list
     * @param {any} type
     * @param {(ev:any).any} listener
     * @param {boolean|AddEventListenerOptions} [options]
     */
    addEventListener( type, listener, options ) {
        return this.workers.map( worker => worker.addEventListener( type, listener, options ) );
    }

    /**
     * Removes the event listener in target's event listener list with the same type, callback, and options.
     * @param {any} type
     * @param {(ev:any).any} listener
     * @param {boolean|EventListenerOptions} [options]
     */
    removeEventListener( type, listener, options ) {
        return this.workers.map( worker => worker.removeEventListener( type, listener, options ) );
    }

    /**
     * Post message to Workers
     * @param {any} message - Message to pass to Workers
     * @param {Transferable[]} [transfer] - Transferable Object List to pass to Worker
     * @param {Transferable[]} [transfer] - Transferable Object List to pass to Worker
     * @returns {Promise}
     */
    postMessage( message, transfer, { modes: { race, spread } = {}, data, transferable } = {} ) {
        if ( race !== undefined || spread !== undefined ) {
            switch ( true ) {
                case race && spread:
                    return Promise.race( this.workers.map( ( worker, i ) => worker.postMessage( { ...message, data: data[i] }, transferable ? transferable[i] : null ) ) );
                case race:
                    return Promise.race( this.workers.map( worker => worker.postMessage( { ...message, data }, transferable ) ) );
                case spread:
                    return Promise.all( this.workers.map( ( worker, i ) => worker.postMessage( { ...message, data: data[i] }, transferable ? transferable[i] : null ) ) );
                default:
                    return Promise.all( this.workers.map( worker => worker.postMessage( { ...message, data }, transferable ) ) );
            }
        }
        return Promise.all( this.workers.map( worker => worker.postMessage( message, transfer ) ) );
    }

    terminate() {
        this.workers.forEach( worker => worker.terminate() );
    }

}

export const Handler = isWorker() ? new ExtendedWorkerHandler() : undefined;

export default {
    ExtendedWorker,
    ExtendedWorkerHandler,
    Cluster,
    Handler
};
