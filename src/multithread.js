/* eslint-env node */
'use strict';

const { Worker, isMainThread } = require( 'worker_threads' );

class Multithread {

    static getModuleWorkerSource( WorkerObject ) {
        let _workerObject;
        if ( WorkerObject && typeof WorkerObject === 'function' ) {
            _workerObject = `(new (${ PromiseHandler.toString() }),(${ WorkerObject.toString() })());`;
        }
        else if ( typeof WorkerObject === 'string' ) {
            _workerObject = `(new (${ PromiseHandler.toString() }),(${ WorkerObject })());`;
        }
        else {
            _workerObject = `(new (${ PromiseHandler.toString() }));`;
        }
        return _workerObject;
    }

    static getWorkerSource( WorkerObject ) {
        try {
            return {
                string() {
                    if ( WorkerObject.startsWith( 'data:' ) ) {
                        return new URL( WorkerObject );
                    }
                    try {
                        if ( encodeURI( WorkerObject ) === WorkerObject ) {
                            return WorkerObject;
                        }
                    }
                    catch ( error ) {
                        console.error( error );
                    }
                },
                function() {
                    return Multithread.getModuleWorkerSource( WorkerObject );
                },
                undefined() {
                    return Multithread.getModuleWorkerSource();
                }

            }[typeof WorkerObject]();
        }
        catch ( error ) {
            console.error( error );
            throw error;
        }
    }

    static getWorkerOptions( WorkerOptions ) {
        if ( WorkerOptions && typeof WorkerOptions === 'object' ) {
            return { eval: true, ...WorkerOptions };
        }
        return { eval: true };
    }

}

class PromiseHandler {

    static #class = class {

        #core = Object.assign(
            Object.create( null ),
            {
                parentPort: undefined,
                workerData: undefined,
                threadId: undefined,
                listeners: Object.create( null )
            }
        );

        constructor() {
            const { parentPort, workerData, threadId } = require( 'worker_threads' );
            this.addListener( 'default', value => value );
            this.#core.parentPort = parentPort;
            this.#core.threadId = threadId;
            this.#core.workerData = workerData;
            this.#core.parentPort.on( 'message', message => this.listen( message ) );
            this.#core.parentPort.on( 'messageerror', message => this.listen( message ) );
            Object.freeze( this.#core );
        }

        get parentPort() {
            return this.#core.parentPort;
        }

        get threadId() {
            return this.#core.threadId;
        }

        get workerData() {
            return this.#core.workerData;
        }

        get listeners() {
            return this.#core.listeners;
        }

        /**
         * @param {MessageEvent} messageEvent
         * @returns {void}
         */
        listen( messageEvent ) {
            const { id, data } = messageEvent;
            if ( typeof data === 'object' && 'type' in data ) {
                if ( data.type in this.#core.listeners ) {
                    this.#core.listeners[data.type]( id, data, messageEvent );
                }
                else {
                    this.#core.listeners.default( id, data, messageEvent );
                }
            }
            else {
                this.#core.listeners.default( id, data, messageEvent );
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
            this.#core.listeners[type] = ( id, data, messageEvent ) => {
                const _data = accessor ? data[accessor] : data;
                const _args = keepEvent ? [ messageEvent, _data ] : [ _data ];
                const _value = func( ..._args );
                if ( _value instanceof Promise ) {
                    _value.then( value => this.#core.parentPort.postMessage( Object.assign( Object.create( null ), { id, data: value, timestamp: Date.now() } ) ) );
                    _value.catch( console.error );
                }
                else {
                    this.#core.parentPort.postMessage( Object.assign( Object.create( null ), { id, data: _value, timestamp: Date.now() } ) );
                }
                return _value;
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
    constructor( ) {
        if ( !( 'isMainThread' in globalThis ) || typeof isMainThread === 'undefined' || !isMainThread ) {
            return ( globalThis._ = new Proxy( new PromiseHandler.#class(), PromiseHandler.#proxyHandler ) );
        }
        throw new Error( 'This has to be run in a worker thread.' );
    }

}

class ExtendedWorkerProxy {

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

class ExtendedClusterProxy {

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

    static #proxyHandler = {
        get: ( target, property ) => {
            if ( property in target ) {
                return target[property];
            }
            const { modes, property: propertyName } = ExtendedClusterProxy.parsePropertyDecorator( property );
            return ( data, transferable ) => target.postMessage( { type: propertyName }, undefined, { modes, data, transferable } );
        }
    };

    constructor( arg1, arg2 ) {
        if ( arg1 instanceof ExtendedCluster ) {
            return new Proxy( arg1, ExtendedClusterProxy.#proxyHandler );
        }
        return new Proxy( new ExtendedCluster( arg1, arg2 ), ExtendedClusterProxy.#proxyHandler );
    }

}

class ExtendedWorker extends Worker {

    static new( WorkerObject, WorkerOptions = {} ) {
        return new ExtendedWorkerProxy( WorkerObject, { eval: true, ...WorkerOptions } );
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
        rejects: Object.create( null )
    };

    #requests = 0;

    constructor( WorkerObject, WorkerOptions ) {
        const _workerObject = Multithread.getWorkerSource( WorkerObject );
        const _workerOptions = Multithread.getWorkerOptions( WorkerOptions );
        super( _workerObject, _workerOptions );
        const messageHandler = message => {
            const { id, err, data } = message;
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
        };
        this.on( 'message', messageHandler );
        this.on( 'messageerror', messageHandler );
        Object.freeze( this.#core );
    }

    postMessage( message, transfer ) {
        const id = this.#requests++;
        const payload = Object.assign( Object.create( null ), { id, data: message, timestamp: Date.now() } );
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

}

class ExtendedCluster {

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
        const cluster = new FunctionExtendedCluster( func );
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
        const cluster = new FunctionExtendedCluster( func );
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
        const cluster = new FunctionExtendedCluster( func );
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
        const cluster = new FunctionExtendedCluster( func );
        const result = await cluster.$_run( data, transferable );
        cluster.terminate();
        return result;
    }

    /**
     * Return a proxied ExtendedCluster
     *
     * The proxied ExtendedCluster is by default a group of 4 module workers set to receive promise-based messages and managed through the builtin handler
     *
     * @param {string|Function} WorkerObject
     * @param {ExtendedWorkerOptions & ExtendedClusterOptions} [ExtendedClusterOptions]
     * @returns {ExtendedClusterProxy}
     */
    static new( WorkerObject, ExtendedClusterOptions = { } ) {
        return new ExtendedClusterProxy( WorkerObject, { eval: true, size: ExtendedCluster.DEFAULT_SIZE, ...ExtendedClusterOptions } );
    }

    #core = {
        size: ExtendedCluster.DEFAULT_SIZE,
        workers: undefined
    };

    /**
     * ExtendedCluster of ExtendedWorker
     *
     * @param {string|Function} WorkerObject
     * @param {ExtendedWorkerOptions & ExtendedClusterOptions} [ExtendedClusterOptions]
     */
    constructor( WorkerObject, ExtendedClusterOptions ) {
        const size = ( ExtendedClusterOptions ? ExtendedClusterOptions.size : ExtendedCluster.DEFAULT_SIZE ) || ExtendedCluster.DEFAULT_SIZE;
        this.#core.workers = Array( size );
        this.#core.size = size;
        for ( let i = 0; i < this.#core.size; i++ ) {
            this.#core.workers[i] = new ExtendedWorker( WorkerObject, ExtendedClusterOptions );
        }
        Object.freeze( this.#core.workers );
        Object.freeze( this.#core );
    }

    on( ...args ) {
        return Promise.all( this.#core.workers.map( worker => worker.on( ...args ) ) );
    }

    once( ...args ) {
        return Promise.all( this.#core.workers.map( worker => worker.once( ...args ) ) );
    }

    /**
     * Post message to Workers
     * @param {any} message - Message to pass to Workers
     * @param {Transferable[]} [transfer] - Transferable Object List to pass to Worker
     * @param {ExtendedClusterMessageOptions} [options] - Advanced Options for `postMessage function
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

class FunctionWorker extends ExtendedWorkerProxy {

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

class FunctionCluster extends ExtendedClusterProxy {

    /**
     * @param {Function} fn
     * @param {ExtendedClusterOptions} [ExtendedClusterOptions]
     */
    constructor( fn, ExtendedClusterOptions ) {
        super( `async()=>_.proxy_run(${ fn })`, { size: ExtendedCluster.DEFAULT_SIZE, ...ExtendedClusterOptions } );
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

module.exports = {
    ExtendedCluster,
    ExtendedClusterProxy,
    ExtendedWorker,
    ExtendedWorkerProxy,
    FunctionCluster,
    FunctionWorker,
    PromiseHandler
};
