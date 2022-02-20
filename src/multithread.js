/* eslint-env module */

import { getLastPath, removeStartingSlash } from './utils.js';


/**
 * @callback MessageHandler
 * @param {any} Event
 * @returns {any}
 */

export class PromiseHandler {

    /**
     * @typedef {Object} PromiseListenerOptions
     * @property {boolean} keepEvent
     * @property {string} accessor
     */

    /**
     * @typedef {PromiseHandler & Proxy} PromiseHandlerProxy
     */

    constructor() {
        this.listeners = Object.create( null );
        this.addListener( 'default', value => value );
        this.worker.onmessage = message => this.listen( message );
        this.worker._ = this.proxy;
    }

    /**
     * @returns {globalThis}
     */
    // eslint-disable-next-line class-methods-use-this
    get worker() {
        return globalThis || self || window;
    }

    /**
     * @returns {PromiseHandlerProxy}
     */
    get proxy() {
        return new Proxy( this, {
            get: ( target, property ) => {
                if ( property in target ) {
                    return target[property];
                }
                return ( func, options ) => target.addListener( property, func, options || { accessor: 'data' } );
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
                _value.then( value => this.worker.postMessage( { id, data: value } ) );
                _value.catch( console.error );
            }
            else {
                this.worker.postMessage( { id, data: _value } );
            }
        };
    }

}


export class ExtendedWorker {

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
     * @typedef {[any,Transferable[]?]} WorkerMessagePayload
     */

    /**
     * @returns {globalThis}
     */
    static get globalThis() {
        return globalThis || self || window;
    }

    /**
     * @returns {{[number]:ExtendedWorker,length:number}}
     */
    static get global() {
        if ( 'ExtendedWorkers' in this.globalThis ) {
            return this.globalThis.ExtendedWorkers;
        }
        return ( this.globalThis.ExtendedWorkers = Object.assign( Object.create( null ), { length: 0 } ) );
    }

    /**
     * @param {ExtendedWorker} worker
     * @returns {number}
     */
    static add( worker ) {
        const workers = ExtendedWorker.global;
        const id = workers.length++;
        workers[id] = worker;
        return id;
    }

    /**
     * @param {number} id
     * @returns {ExtendedWorker}
     */
    static get( id ) {
        return ExtendedWorker.global[id];
    }

    /**
     * @param {number} id
     * @returns {void}
     */
    static delete( id ) {
        ExtendedWorker.global[id] = null;
    }

    /**
     * @returns {void}
     */
    static terminateAll() {
        const workers = ExtendedWorker.global;
        for ( const id in workers ) {
            if ( workers[id] ) {
                workers[id].terminate();
            }
        }
    }

    /**
     * ExtendedWorker Message Reception Handling
     * @param {MessageEvent} message - Message received by a Worker
     * @returns {void}
     */
    static onMessage( message ) {
        const { id: { workerId, messageId }, err, data } = message.data;
        const worker = ExtendedWorker.get( workerId );
        const resolve = worker.resolves[messageId];
        const reject = worker.rejects[messageId];
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
        worker.delete( messageId );
    }

    /**
     * @returns {PromiseHandler}
     */
    static get Handler() {
        return PromiseHandler;
    }

    /**
     * @returns {string}
     */
    static get scriptHandler() {
        return `()=>(globalThis||self||window).listeners=new (${ PromiseHandler.toString() })();`;
    }

    /**
     * @returns {string}
     */
    static get moduleHandler() {
        return `(globalThis||self||window)._=(new (${ PromiseHandler.toString() })()).proxy;`;
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
            modules.push( ExtendedWorker.moduleHandler );
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
        return ExtendedWorker.toObjectURL( `(${ ExtendedWorker.scriptHandler })();` );
    }

    /**
     * @param {string} WorkerString
     * @returns {string}
     */
    static uglifyScriptWorker( WorkerString ) {
        if ( typeof WorkerString === 'string' ) {
            return ExtendedWorker.toObjectURL( WorkerString );
        }
        throw new Error( 'WorkerString is not a string.' );
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
            ...ExtendedWorker.importModuleLocalScripts( WorkerOptions ),
            ...ExtendedWorker.importModuleScripts( WorkerOptions )
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
     * @param {ExtendedWorkerOptions} [WorkerOptions]
     * @returns {string}
     */
    static prepareForScriptImport( WorkerString, WorkerOptions = {} ) {
        if ( typeof WorkerString !== 'string' ) {
            throw new Error( 'WorkerString is not a string.' );
        }
        const scripts = [
            ...ExtendedWorker.importLocalScripts( WorkerOptions ),
            ...ExtendedWorker.importScripts( WorkerOptions )
        ];
        if ( 'includeHandler' in WorkerOptions && WorkerOptions.includeHandler === true ) {
            scripts.push( ExtendedWorker.getHandlerAsURL() );
        }
        let WorkerBody;
        if ( 'uglify' in WorkerOptions && WorkerOptions.uglify === true ) {
            scripts.push( ExtendedWorker.uglifyScriptWorker( WorkerString ) );
            WorkerBody = `importScripts("${ scripts.join( '","' ) }");`;
        }
        else {
            WorkerBody = `${ scripts.length > 0 ? `importScripts("${ scripts.join( '","' ) }");\n` : '' }(${ WorkerString })();`;
        }
        return ExtendedWorker.toObjectURL( WorkerBody );

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
                return ExtendedWorker.prepareForModuleImport( WorkerString, WorkerOptions );
            }
            else if ( 'type' in WorkerOptions && !( WorkerOptions.type === 'module' || WorkerOptions.type === 'classic' ) ) {
                throw new Error( `WorkerOptions.type:${ WorkerOptions.type } is not a valid type.` );
            }
            else {
                return ExtendedWorker.prepareForScriptImport( WorkerString, WorkerOptions );
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
     * @param {ExtendedWorkerOptions} [WorkerOptions]
     * @returns {ExtendedWorkerProxy}
     */
    static new( WorkerObject, WorkerOptions = {} ) {
        return new ExtendedWorker( WorkerObject, { promise: true, type: 'module', includeHandler: true, ...WorkerOptions } ).proxy;
    }

    /**
     * Run a single function in a worker and terminate the worker once the function has been executed
     *
     * @param {string|Function} func
     * @param {any} [data]
     * @param {Transferable[]} [transferable]
     */
    static async run( func, data, transferable ) {
        const worker = ExtendedWorker.new( `async()=>_.run(${ func })` );
        const result = await worker.run( data, transferable );
        worker.terminate();
        return result;
    }

    /**
     * @param {string|Function} WorkerObject
     * @param {ExtendedWorkerOptions} [WorkerOptions]
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
        const workerId = ExtendedWorker.add( this );
        Object.defineProperty( this, 'internals', {
            value: Object.preventExtensions(
                Object.assign(
                    Object.create( null ),
                    {
                        workerId,
                        name: ( WorkerOptions ? WorkerOptions.name : undefined ) || workerId,
                        worker: new Worker( _workerObject, WorkerOptions ),
                        promise: WorkerOptions && WorkerOptions.promise,
                        resolves: Object.create( null ),
                        rejects: Object.create( null ),
                        requests: 0
                    }
                )
            )
        } );
        if ( WorkerOptions && 'promise' in WorkerOptions && WorkerOptions.promise === true ) {
            this.worker.onmessage = ExtendedWorker.onMessage;
        }
    }

    /**
     * @returns {Worker}
     */
    get worker() {
        return this.internals.worker;
    }

    /**
     * @returns {number}
     */
    get workerId() {
        return this.internals.workerId;
    }

    /**
     * @returns {boolean}
     */
    get promise() {
        return this.internals.promise;
    }

    /**
     * @returns {Object.<number,Promise<any>>}
     */
    get resolves() {
        return this.internals.resolves;
    }

    /**
     * @returns {Object.<number,Promise<any>>}
     */
    get rejects() {
        return this.internals.rejects;
    }

    /**
     * @returns {number}
     */
    get requests() {
        return this.internals.requests++;
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
     * @param {string} id - Unique messageId
     * @returns {void}
     */
    delete( id ) {
        delete this.resolves[id];
        delete this.rejects[id];
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
     * @param {MessageHandler} listener
     * @param {boolean|AddEventListenerOptions} [options]
     */
    addEventListener( type, listener, options ) {
        return this.worker.addEventListener( type, listener, options );
    }

    /**
     * Removes the event listener in target's event listener list with the same type, callback, and options.
     * @param {any} type
     * @param {MessageHandler} listener
     * @param {boolean|EventListenerOptions} [options]
     */
    removeEventListener( type, listener, options ) {
        this.worker.removeEventListener( type, listener, options );
    }

    terminate() {
        this.worker.terminate();
        ExtendedWorker.delete( this.workerId );
    }

    /**
     * Post message to Worker
     * @param {any} message - Message to pass to Worker
     * @param {Transferable[]} [transfer] - Transferable Object List to pass to Worker
     * @returns {void|Promise}
     */
    postMessage( message, transfer ) {
        const {
            worker,
            workerId,
            promise,
            requests
        } = this;
        if ( promise ) {
            const messageId = requests;
            const payloadId = Object.assign( Object.create( null ), {
                workerId,
                messageId
            } );
            const payload = { id: payloadId, data: message };
            return new Promise( ( resolve, reject ) => {
                this.resolves[messageId] = resolve;
                this.rejects[messageId] = reject;
                if ( transfer ) {
                    worker.postMessage( payload, transfer );
                }
                else {
                    worker.postMessage( payload );
                }
            } );
        }
        worker.postMessage( message, transfer );
    }

}

export class Cluster {

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

    static get globalThis() {
        return globalThis || self || window;
    }

    static get global() {
        if ( 'Clusters' in this.globalThis ) {
            return this.globalThis.Clusters;
        }
        return ( this.globalThis.Clusters = Object.assign( Object.create( null ), {
            length: 0,
            internals: Object.preventExtensions( Object.assign( Object.create( null ), { DEFAULT_SIZE: 4 } ) )
        } ) );
    }

    /**
     * @param {number} size - Number of Workers to spawn
     */
    static set DEFAULT_SIZE( size ) {
        this.global.internals.DEFAULT_SIZE = size;
    }

    /**
     * @returns {number}
     */
    static get DEFAULT_SIZE() {
        return this.global.internals.DEFAULT_SIZE;
    }

    /**
     * @param {Cluster} cluster
     * @returns {number}
     */
    static add( cluster ) {
        const clusters = Cluster.global;
        const id = clusters.length++;
        clusters[id] = cluster;
        return id;
    }

    /**
     * @param {number} id
     * @returns {Cluster}
     */
    static get( id ) {
        const clusters = Cluster.global;
        return clusters[id];
    }

    /**
     * @param {number} id
     * @returns {void}
     */
    static delete( id ) {
        const clusters = Cluster.global;
        if ( clusters[id] ) {
            clusters[id] = null;
        }
    }

    /**
     * @returns {void}
     */
    static terminateAll() {
        const clusters = Cluster.global;
        // eslint-disable-next-line guard-for-in
        for ( const id in clusters ) {
            clusters[id].terminate();
        }
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
    static new( WorkerObject, ClusterOptions = { size: Cluster.DEFAULT_SIZE } ) {
        return new Cluster( WorkerObject, { promise: true, type: 'module', includeHandler: true, ...ClusterOptions } ).proxy;
    }

    /**
     * @param {Function} func
     * @param {any} [data]
     * @param {Transferable[]} [transferable]
     */
    static async run( func, data, transferable ) {
        const cluster = Cluster.new( `async()=>_.run(${ func })`, { size: Cluster.DEFAULT_SIZE } );
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
        const cluster = Cluster.new( `async()=>_.run(${ func })`, { size: Cluster.DEFAULT_SIZE } );
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
        const cluster = Cluster.new( `async()=>_.run(${ func })`, { size: Cluster.DEFAULT_SIZE } );
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
     * @param {ExtendedWorkerOptions & ClusterOptions} [ClusterOptions]
     */
    constructor( WorkerObject, ClusterOptions ) {
        const clusterId = Cluster.add( this );
        Object.defineProperty( this, 'internals', {
            value: Object.preventExtensions(
                Object.assign(
                    Object.create( null ),
                    {
                        workers: [],
                        clusterId,
                        size: ClusterOptions ? ClusterOptions.size : Cluster.DEFAULT_SIZE
                    }
                )
            )
        } );
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
     * @returns {ExtendedWorker[]}
     */
    get workers() {
        return this.internals.workers;
    }

    /**
     * @returns {number}
     */
    get clusterId() {
        return this.internals.clusterId;
    }

    /**
     * @returns {number}
     */
    get size() {
        return this.internals.size;
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
     * @param {MessageHandler} listener
     * @param {boolean|AddEventListenerOptions} [options]
     */
    addEventListener( type, listener, options ) {
        return this.workers.map( worker => worker.addEventListener( type, listener, options ) );
    }

    /**
     * Removes the event listener in target's event listener list with the same type, callback, and options.
     * @param {any} type
     * @param {MessageHandler} listener
     * @param {boolean|EventListenerOptions} [options]
     */
    removeEventListener( type, listener, options ) {
        return this.workers.map( worker => worker.removeEventListener( type, listener, options ) );
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
        Cluster.delete( this.clusterId );
    }

}

export default {
    ExtendedWorker,
    PromiseHandler,
    Cluster
};
