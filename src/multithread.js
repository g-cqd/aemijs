/* eslint-env module */
'use strict';

/**
 * @typedef {Object} PromiseListenerOptions
 * @property {boolean} keepEvent
 * @property {string} accessor
 */

/**
 * @callback MessageHandler
 * @param {any} Event
 * @returns {any}
 */

/**
 * @typedef {PromiseHandler & Proxy} PromiseHandlerProxy
 */

/**
 * @typedef {Object} ExtendedWorkerOptions
 * @property {Boolean} [promise] - Whether to return a Promise from ExtendedWorker.postMessage
 * @property {String|String[]} [importScripts] - Third-party Scripts to import into the Worker
 * @property {Boolean} [includeHandler] - Whether to include the default PromiseHandler in the worker
 * @property {String|String[]} [localImports] - Local Scripts to import into the Worker
 * @property {Boolean} [uglify] - Wrap your function in importScripts
 * @property {"include"|"omit"|"same-origin"} [credentials] - Whether to send credentials with requests
 * @property {String} [name] - Name of the worker
 * @property {"classic"|"module"} [type] - Type of the worker
 */

/**
 * @typedef {Object} ExtendedWorkerPromiseHandler
 * @property {Object.<string,Function>} resolves
 * @property {Object.<string,Function>} rejects
 * @property {number} instances
 */

/**
 * @typedef {ExtendedWorker & Proxy} ExtendedWorkerProxy
 */

/**
 * @typedef {Object} ClusterOptions
 * @property {number} [size=4] - Number of Workers to spawn
 */

/**
 * @typedef {Object} ClusterModeOptions
 * @property {boolean} race
 * @property {boolean} spread
 */

/**
 * @typedef {Object} ClusterMessageOptions
 * @property {any} [data]
 * @property {Transferable[]} [transferable]
 * @property {ClusterModeOptions} [modes]
 */

/**
 * @typedef {Cluster & Proxy} ClusterProxy
 */

class Multithread {

    /**
     * @returns {string}
     */
    static get scriptHandler() {
        return `()=>((globalThis||self||window)._=new (${ PromiseHandler.toString() })());`;
    }

    /**
     * @returns {string}
     */
    static get moduleHandler() {
        return `(globalThis||self||window)._=new (${ PromiseHandler.toString() })();`;
    }

    /**
     * @param {ExtendedWorkerOptions} [WorkerOptions]
     * @returns {string[]}
     */
    static importLocalScripts( WorkerOptions = {} ) {
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
     * @param {ExtendedWorkerOptions} [WorkerOptions]
     * @returns {string[]}
     */
    static importScripts( WorkerOptions = {} ) {
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
     * @param {ExtendedWorkerOptions} [WorkerOptions]
     * @returns {string[]}
     */
    static importModuleLocalScripts( WorkerOptions = {} ) {
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
            modules.push( Multithread.moduleHandler );
        }
        return modules;
    }

    /**
     * @param {ExtendedWorkerOptions} [WorkerOptions]
     * @returns {string[]}
     */
    static importModuleScripts( WorkerOptions = {} ) {
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

    /**
     * @returns {string}
     */
    static getHandlerAsURL() {
        return Multithread.toObjectURL( `(${ Multithread.scriptHandler })();` );
    }

    /**
     * @param {string} WorkerString
     * @returns {string}
     */
    static uglifyScriptWorker( WorkerString ) {
        if ( typeof WorkerString === 'string' ) {
            return Multithread.toObjectURL( WorkerString );
        }
        throw new Error( 'WorkerString is not a string.' );
    }

    /**
     * @param {string} WorkerString
     * @param {ExtendedWorkerOptions} [WorkerOptions]
     * @returns {string}
     */
    static prepareForScriptImport( WorkerString, WorkerOptions = {} ) {
        if ( typeof WorkerString !== 'string' ) {
            throw new Error( 'WorkerString is not a string.' );
        }
        const scripts = [
            ...Multithread.importLocalScripts( WorkerOptions ),
            ...Multithread.importScripts( WorkerOptions )
        ];
        if ( 'includeHandler' in WorkerOptions && WorkerOptions.includeHandler === true ) {
            scripts.push( Multithread.getHandlerAsURL() );
        }
        let WorkerBody;
        if ( 'uglify' in WorkerOptions && WorkerOptions.uglify === true ) {
            scripts.push( Multithread.uglifyScriptWorker( WorkerString ) );
            WorkerBody = `importScripts("${ scripts.join( '","' ) }");`;
        }
        else {
            WorkerBody = `${ scripts.length > 0 ? `importScripts("${ scripts.join( '","' ) }");\n` : '' }(${ WorkerString })();`;
        }
        return Multithread.toObjectURL( WorkerBody );
    }

    /**
     * @param {string} WorkerString
     * @param {ExtendedWorkerOptions} [WorkerOptions]
     * @returns {string}
     */
    static prepareForModuleImport( WorkerString, WorkerOptions = {} ) {
        if ( typeof WorkerString !== 'string' ) {
            throw new Error( 'WorkerString is not a string.' );
        }
        const modules = [
            ...Multithread.importModuleLocalScripts( WorkerOptions ),
            ...Multithread.importModuleScripts( WorkerOptions )
        ];
        let WorkerBody;
        if ( 'uglify' in WorkerOptions && WorkerOptions.uglify === true ) {
            throw new Error( 'WorkerOptions.uglify can not be applied to module worker.' );
        }
        else {
            WorkerBody = `${ modules.length > 0 ? `${ modules.join( '\n' ) }\n` : '' }(${ WorkerString })();`;
        }
        return Multithread.toObjectURL( WorkerBody );
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
     * @param {string} WorkerString
     * @param {ExtendedWorkerOptions} [WorkerOptions]
     * @returns {string}
     */
    static createObjectURL( WorkerString, WorkerOptions = {} ) {
        if ( typeof WorkerOptions === 'object' ) {
            if ( 'type' in WorkerOptions && WorkerOptions.type === 'module' ) {
                return Multithread.prepareForModuleImport( WorkerString, WorkerOptions );
            }
            else if ( 'type' in WorkerOptions && !( WorkerOptions.type === 'module' || WorkerOptions.type === 'classic' ) ) {
                throw new Error( `WorkerOptions.type:${ WorkerOptions.type } is not a valid type.` );
            }
            else {
                return Multithread.prepareForScriptImport( WorkerString, WorkerOptions );
            }
        }
        else if ( typeof WorkerString === 'string' ) {
            return Multithread.toObjectURL( WorkerString );
        }
        throw new Error( 'WorkerString is not a string.' );
    }

}

/**
 * Get last path element without path nor extension
 *
 * @param {string} path - Path to file
 * @returns {string}
 */
function getLastPath( path ) {
    return path
        .split( /\//gu )
        .pop()
        .split( /\./gu )
        .filter( str => str.length > 0 )
        .shift();
}

/**
 * Remove starting slashes
 *
 * @param {string} path
 * @returns {string}
 */
function removeStartingSlash( path ) {
    return `${ path.replace( /^\/*/gu, '' ) }`;
}

export class PromiseHandler {

    static #class = class {

        #core = Object.assign( Object.create( null ), { listeners: Object.create( null ) } );

        constructor() {
            this.addListener( 'default', value => value );
            globalThis.addEventListener( 'message', message => this.listen( message ) );
            globalThis.addEventListener( 'messageerror', message => this.listen( message ) );
            Object.freeze( this.#core );
        }

        get listeners() {
            return this.#core.listeners;
        }

        /**
         * @param {MessageEvent} messageEvent
         * @returns {void}
         */
        listen( messageEvent ) {
            const { id, data } = messageEvent.data;
            if ( typeof data === 'object' && 'type' in data ) {
                if ( data.type in this.listeners ) {
                    this.listeners[data.type]( id, data, messageEvent );
                }
                else {
                    this.listeners.default( id, data, messageEvent );
                }
            }
            else {
                this.listeners.default( id, data, messageEvent );
            }
        }

        /**
         * @param {String} type - Message Type to look for when receiving a message
         * @param {Function} func - Message Handler to call
         * @param {PromiseListenerOptions} [options] - Options used to parse message data
         * @returns {void}
         */
        addListener( type, func, options = {} ) {
            const { keepEvent, accessor } = options;
            this.listeners[type] = ( id, data, messageEvent ) => {
                const _data = accessor ? data[accessor] : data;
                const _args = keepEvent ? [ messageEvent, _data ] : [ _data ];
                const _value = func( ..._args );
                if ( _value instanceof Promise ) {
                    _value.then( value => globalThis.postMessage( { id, data: value } ) );
                    _value.catch( console.error );
                }
                else {
                    globalThis.postMessage( { id, data: _value } );
                }
            };
        }

    };

    /** @type {ProxyHandler} */
    static #proxyHandler = {
        get: ( target, property ) => {
            if ( property in target ) {
                return target[property];
            }
            return ( func, options ) => target.addListener( property, func, options || { accessor: 'data' } );
        }
    };

    /**
     * @returns {Proxy}
     */
    constructor() {
        return ( globalThis._ = new Proxy( new PromiseHandler.#class(), PromiseHandler.#proxyHandler ) );
    }

}

export class ExtendedWorkerProxy {

    /** @type {ProxyHandler} */
    static #proxyHandler = {
        get: ( target, property ) => {
            if ( property in target ) {
                return target[property];
            }
            return ( data, transferable ) => target.postMessage( { type: property, data }, transferable );
        }
    };

    /**
     * @param {ExtendedWorker|WorkerObject} arg1
     * @param {ProxyHandler} [arg2]
     * @returns {Promise}
     */
    constructor( arg1, arg2 ) {
        if ( arg1 instanceof ExtendedWorker ) {
            return new Proxy( arg1, ExtendedWorkerProxy.#proxyHandler );
        }
        return new Proxy( new ExtendedWorker( arg1, arg2 ), ExtendedWorkerProxy.#proxyHandler );
    }

}

export class ClusterProxy {

    /**
     * @param {string|number|Symbol} property
     * @returns {object}
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

    /** @type {ProxyHandler} */
    static #proxyHandler = {
        get: ( target, property ) => {
            if ( property in target ) {
                return target[property];
            }
            const { modes, property: propertyName } = ClusterProxy.parsePropertyDecorator( property );
            return ( data, transferable ) => target.postMessage( { type: propertyName }, undefined, { modes, data, transferable } );
        }
    };

    /**
     * @param {Cluster|WorkerObject} arg1
     * @param {ProxyHandler} [arg2]
     * @returns {Promise}
     */
    constructor( arg1, arg2 ) {
        if ( arg1 instanceof Cluster ) {
            return new Proxy( arg1, ClusterProxy.#proxyHandler );
        }
        return new Proxy( new Cluster( arg1, arg2 ), ClusterProxy.#proxyHandler );
    }

}

export class ExtendedWorker extends Worker {

    /**
     * Return a proxied ExtendedWorker
     *
     * The proxied ExtendedWorker is by default a module worker set to receive promise-based messages and managed through an builtin handler
     *
     * @param {string|Function} WorkerObject
     * @param {ExtendedWorkerOptions} [WorkerOptions]
     * @returns {ExtendedWorkerProxy}
     */
    static new( WorkerObject, WorkerOptions = {} ) {
        return new ExtendedWorkerProxy( WorkerObject, { promise: true, type: 'module', includeHandler: true, ...WorkerOptions } );
    }

    /**
     * Run a single function in a worker and terminate the worker once the function has been executed
     *
     * @param {string|Function} func
     * @param {any} [data]
     * @param {Transferable[]} [transferable]
     */
    static async run( func, data, transferable ) {
        const worker = new FunctionWorker( func );
        const result = await worker.run( data, transferable );
        worker.terminate();
        return result;
    }

    #core = {
        resolves: Object.create( null ),
        rejects: Object.create( null ),
        promise: false
    };

    #requests = 0;

    /**
     * @param {string|Function} WorkerObject
     * @param {ExtendedWorkerOptions} [WorkerOptions]
     */
    constructor( WorkerObject, WorkerOptions ) {
        let _workerObject;
        if ( typeof WorkerObject === 'function' ) {
            _workerObject = Multithread.createObjectURL( WorkerObject.toString(), WorkerOptions );
        }
        else if ( typeof WorkerObject === 'string' ) {
            _workerObject = Multithread.createObjectURL( WorkerObject, WorkerOptions );
        }
        else {
            throw new Error( 'WorkerObject is not a string or a function.' );
        }
        super( _workerObject, WorkerOptions );
        if ( this.#core.promise = WorkerOptions && WorkerOptions.promise ) {
            const messageHandler = message => {
                if ( this.#core.promise ) {
                    const { id, err, data } = message.data;
                    const resolve = this.#core.resolves[id];
                    const reject = this.#core.rejects[id];
                    if ( !err && resolve ) {
                        resolve( data );
                    }
                    else if ( reject && err ) {
                        reject( err );
                    }
                    delete this.#core.resolves[id];
                    delete this.#core.rejects[id];
                }
            };
            this.addEventListener( 'message', messageHandler );
            this.addEventListener( 'messageerror', messageHandler );
        }
        Object.freeze( this.#core );
    }

    /**
     * Post message to Worker
     * @param {any} message - Message to pass to Worker
     * @param {Transferable[]} [transfer] - Transferable Object List to pass to Worker
     * @returns {void|Promise}
     */
    postMessage( message, transfer ) {
        const id = this.#requests++;
        if ( this.#core.promise ) {
            const payload = Object.assign( Object.create( null ), { id, data: message } );
            return new Promise( ( resolve, reject ) => {
                this.#core.resolves[id] = resolve;
                this.#core.rejects[id] = reject;
                if ( transfer ) {
                    super.postMessage( payload, transfer );
                }
                else {
                    super.postMessage( payload );
                }
            } );
        }
        super.postMessage( message, transfer );
    }

}

export class Cluster {

    static #DEFAULT_SIZE = 4;

    /**
     * @param {number} size - Number of Workers to spawn
     */
    static set DEFAULT_SIZE( size ) {
        this.#DEFAULT_SIZE = size;
    }

    /**
     * @returns {number}
     */
    static get DEFAULT_SIZE() {
        return this.#DEFAULT_SIZE;
    }

    /**
     * @param {Function} func
     * @param {any} [data]
     * @param {Transferable[]} [transferable]
     */
    static async run( func, data, transferable ) {
        const cluster = new FunctionCluster( func );
        const result = await cluster.run( data, transferable );
        cluster.terminate();
        return result;
    }

    /**
     * @param {Function} func
     * @param {any} [data]
     * @param {Transferable[]} [transferable]
     */
    static async $run( func, data, transferable ) {
        const cluster = new FunctionCluster( func );
        const result = await cluster.$run( data, transferable );
        cluster.terminate();
        return result;
    }

    /**
     * @param {Function} func
     * @param {any} [data]
     * @param {Transferable[]} [transferable]
     */
    static async _run( func, data, transferable ) {
        const cluster = new FunctionCluster( func );
        const result = await cluster._run( data, transferable );
        cluster.terminate();
        return result;
    }

    /**
     * @param {Function} func
     * @param {any} [data]
     * @param {Transferable[]} [transferable]
     */
    // eslint-disable-next-line camelcase
    static async $_run( func, data, transferable ) {
        const cluster = new FunctionCluster( func );
        const result = await cluster.$_run( data, transferable );
        cluster.terminate();
        return result;
    }

    /**
     * Return a proxied Cluster
     *
     * The proxied Cluster is by default a group of 4 module workers set to receive promise-based messages and managed through the builtin handler
     *
     * @param {string|Function} WorkerObject
     * @param {ExtendedWorkerOptions & ClusterOptions} [ClusterOptions]
     * @returns {ClusterProxy}
     */
    static new( WorkerObject, ClusterOptions = { } ) {
        return new ClusterProxy( WorkerObject, { promise: true, type: 'module', includeHandler: true, size: Cluster.DEFAULT_SIZE, ...ClusterOptions } );
    }

    #core = {
        size: Cluster.DEFAULT_SIZE,
        workers: undefined
    };

    /**
     * Cluster of ExtendedWorker
     *
     * @param {string|Function} WorkerObject
     * @param {ExtendedWorkerOptions & ClusterOptions} [ClusterOptions]
     */
    constructor( WorkerObject, ClusterOptions ) {
        const size = ( ClusterOptions ? ClusterOptions.size : Cluster.DEFAULT_SIZE ) || Cluster.DEFAULT_SIZE;
        this.#core.workers = Array( size );
        this.#core.size = size;
        for ( let i = 0; i < this.#core.size; i++ ) {
            this.#core.workers[i] = new ExtendedWorker( WorkerObject, ClusterOptions );
        }
        Object.freeze( this.#core.workers );
        Object.freeze( this.#core );
    }

    /**
     * @param {Event} event
     * @returns {Boolean[]}
     */
    dispatchEvent( event ) {
        return Promise.all( this.#core.workers.map( worker => worker.dispatchEvent( event ) ) );
    }

    /**
     * Add event listener in target's event listener list
     * @param {any} type
     * @param {MessageHandler} listener
     * @param {boolean|AddEventListenerOptions} [options]
     */
    addEventListener( type, listener, options ) {
        return Promise.all( this.#core.workers.map( worker => worker.addEventListener( type, listener, options ) ) );
    }

    /**
     * Removes the event listener in target's event listener list with the same type, callback, and options.
     * @param {any} type
     * @param {MessageHandler} listener
     * @param {boolean|EventListenerOptions} [options]
     */
    removeEventListener( type, listener, options ) {
        return Promise.all( this.#core.workers.map( worker => worker.removeEventListener( type, listener, options ) ) );
    }

    /**
     * Post message to Workers
     * @param {any} message - Message to pass to Workers
     * @param {Transferable[]} [transfer] - Transferable Object List to pass to Worker
     * @param {ClusterMessageOptions} [options] - Advanced Options for `postMessage function
     * @returns {Promise}
     */
    postMessage( message, transfer, { modes: { race, spread } = {}, data, transferable } = {} ) {
        if ( race !== undefined || spread !== undefined ) {
            switch ( true ) {
                case race && spread:
                    return Promise.race( this.#core.workers.map( ( worker, i ) => worker.postMessage( { ...message, data: data[i] }, transferable ? transferable[i] : null ) ) );
                case race:
                    return Promise.race( this.#core.workers.map( worker => worker.postMessage( { ...message, data }, transferable ) ) );
                case spread:
                    return Promise.all( this.#core.workers.map( ( worker, i ) => worker.postMessage( { ...message, data: data[i] }, transferable ? transferable[i] : null ) ) );
                default:
                    return Promise.all( this.#core.workers.map( worker => worker.postMessage( { ...message, data }, transferable ) ) );
            }
        }
        return Promise.all( this.#core.workers.map( worker => worker.postMessage( message, transfer ) ) );
    }

    terminate() {
        for ( const worker of this.#core.workers ) {
            worker.terminate();
        }
    }

}

export class FunctionWorker extends ExtendedWorkerProxy {

    /**
     * @param {Function} fn
     * @param {WorkerOptions} [WorkerOptions]
     */
    constructor( fn, WorkerOptions ) {
        super( `async()=>_.proxy_run(${ fn.toString() })`, { promise: true, type: 'module', includeHandler: true, ...WorkerOptions } );
    }

    /**
     * @param {...any} [args]
     * @returns {Promise}
     */
    run( ...args ) {
        return super.proxy_run( ...args );
    }

}

export class FunctionCluster extends ClusterProxy {

    /**
     * @param {Function} fn
     * @param {ClusterOptions} [ClusterOptions]
     */
    constructor( fn, ClusterOptions ) {
        super( `async()=>_.proxy_run(${ fn })`, { size: Cluster.DEFAULT_SIZE, ...ClusterOptions } );
    }

    /**
     * @param {...any} [args]
     * @returns {Promise}
     */
    run( ...args ) {
        return super.proxy_run( ...args );
    }

    /**
     * @param {...any} [args]
     * @returns {Promise}
     */
    $run( ...args ) {
        return super.$proxy_run( ...args );
    }

    /**
     * @param {...any} [args]
     * @returns {Promise}
     */
    _run( ...args ) {
        return super._proxy_run( ...args );
    }

    /**
     * @param {...any} [args]
     * @returns {Promise}
     */
    // eslint-disable-next-line camelcase
    $_run( ...args ) {
        return super.$_proxy_run( ...args );
    }

}

export default {
    Cluster,
    ClusterProxy,
    ExtendedWorker,
    ExtendedWorkerProxy,
    FunctionCluster,
    FunctionWorker,
    PromiseHandler
};
