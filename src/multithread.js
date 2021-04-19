const { getGlobal, newUID } = require( './utils.js' );
const { Worker } = require( 'worker_threads' );

class PromiseWorker {
    /**
	 * @param {String|URL} WorkerObject - Function String or Worker file URL from which to create an PromiseWorker
	 * @param {{
	 *  promise?:Boolean,
     *  manageable?:Boolean,
	 *  argv?:any[],
	 *  env?:Object,
	 *  execArgv?: String[],
	 *  stdin?: Boolean,
	 *  stdout?: Boolean,
	 *  stderr?: Boolean,
	 *  workerData?: any,
	 *  trackUnmanagedFds?: Boolean,
	 *  transferList?: Object[],
	 *  resourceLimits?: {
     *   maxOldGenerationSizeMb?:Number,
     *   maxYoungGenerationSizeMb?:Number,
     *   codeRangeSizeMb?:Number,
     *   stackSizeMb?:Number,
     * },
	 * }} [WorkerOptions] - Options to configure PromiseWorker
	 */
    constructor ( WorkerObject, WorkerOptions ) {
        let _workerOptions = WorkerOptions;
        if ( typeof WorkerObject === 'function' ) {
            WorkerObject = PromiseWorker.prepareFromFunction( WorkerObject );
            if ( WorkerOptions ) {
                _workerOptions = { ...WorkerOptions, eval: true };
            } else {
                _workerOptions = { eval: true };
            }
        }
        if ( _workerOptions ) {
            if ( _workerOptions.manageable === true ) {
                _workerOptions = { ..._workerOptions, workerData: [_workerOptions.workerData, PromiseWorker.workerManager] };
            }
        }
        this.worker = new Worker( WorkerObject, _workerOptions );
        if ( _workerOptions && 'promise' in _workerOptions && _workerOptions.promise === true ) {
            this.worker.promise = true;
            PromiseWorker.assert();
            this.onmessage = PromiseWorker.onMessage;
        } else {
            this.worker.promise = false;
        }
    }
    /**
	 * Return a Worker-ready ObjectURL from a specified function string
	 * @param {String} WorkerString - Function string from which to create PromiseWorker
	 * @returns {String} ObjectURL from Function String
	 */
    static prepareFromString( WorkerString ) {
        if ( typeof WorkerString === 'string' ) {
            return `(${WorkerString})();`;
        }
        throw new Error( `WorkerString:${WorkerString} is not a string.` );
    }
    /**
	 * Return a Worker-ready ObjectURL from a specified function
	 * @param {String} WorkerString - Function from which to create PromiseWorker
	 * @returns {String} ObjectURL from Function
	 */
    static prepareFromFunction( WorkerFunction ) {
        if ( typeof WorkerFunction === 'function' ) {
            return PromiseWorker.prepareFromString( WorkerFunction.toString() );
        }
        throw new Error( `WorkerFunction:${WorkerFunction} is not a function.` );
    }
    /**
	 * Create an PromiseWorker from a specified function string
	 * @param {String} WorkerString - Function string from which to create PromiseWorker
	 * @param {{
	 *  promise?:Boolean,
     *  manageable?:Boolean,
	 *  argv?:any[],
	 *  env?:Object,
	 *  execArgv?: String[],
	 *  stdin?: Boolean,
	 *  stdout?: Boolean,
	 *  stderr?: Boolean,
	 *  workerData?: any,
	 *  trackUnmanagedFds?: Boolean,
	 *  transferList?: Object[],
	 *  resourceLimits?: {
     *   maxOldGenerationSizeMb?:Number,
     *   maxYoungGenerationSizeMb?:Number,
     *   codeRangeSizeMb?:Number,
     *   stackSizeMb?:Number,
     * },
	 * }} [WorkerOptions] - Options to configure PromiseWorker
	 * @returns {PromiseWorker} PromiseWorker from function string
	 */
    static createFromString( WorkerString, WorkerOptions ) {
        if ( typeof WorkerString === 'string' ) {
            let _workerData;
            if ( WorkerOptions ) {
                _workerData = WorkerOptions.workerData;
                if ( WorkerOptions.manageable === true ) {
                    _workerData = [WorkerOptions.workerData, PromiseWorker.workerManager];
                }
            }
            return new PromiseWorker( `(${WorkerString})();`, { ...WorkerOptions, eval: true, workerData: _workerData } );
        }
        throw new Error( `WorkerString:${WorkerString} is not a string.` );
    }
    /**
	 * Create an PromiseWorker from a specified function
	 * @param {Function} WorkerFunction - Function from which to create PromiseWorker
	 * @param {{
	 *  promise?:Boolean,
     *  manageable?:Boolean,
	 *  argv?:any[],
	 *  env?:Object,
	 *  execArgv?: String[],
	 *  stdin?: Boolean,
	 *  stdout?: Boolean,
	 *  stderr?: Boolean,
	 *  workerData?: any,
	 *  trackUnmanagedFds?: Boolean,
	 *  transferList?: Object[],
	 *  resourceLimits?: {
     *   maxOldGenerationSizeMb?:Number,
     *   maxYoungGenerationSizeMb?:Number,
     *   codeRangeSizeMb?:Number,
     *   stackSizeMb?:Number,
     * },
	 * }} [WorkerOptions] - Options to configure PromiseWorker
	 * @returns {PromiseWorker} PromiseWorker from function
	 */
    static createFromFunction( WorkerFunction, WorkerOptions ) {
        if ( typeof WorkerFunction === 'function' ) {
            return PromiseWorker.createFromString( WorkerFunction.toString(), WorkerOptions );
        }
        throw new Error( `WorkerFunction:${WorkerFunction} is not a function.` );
    }
    static get workerManager() {
        return `(${function _workerManager() {
            /* eslint-env node,worker */
            const { parentPort,threadId } = require( 'worker_threads' );
            class WorkerManager {
                constructor () {
                    this.mainThread = parentPort;
                    this.typeListeners = {};
                    this.on( 'default', value => value );
                    this.mainThread.on( 'message', messageEvent => {
                        this.manage( messageEvent );
                    } );
                    console.log( `WorkerManager created on Worker#${threadId}.` );
                }

                /**
                 * @returns {globalThis}
                 */
                get self() {
                    return globalThis;
                }

                /**
                 * @param {MessageEvent} messageEvent 
                 * @returns {void}
                 */
                manage( messageEvent ) {
                    const { id, data } = messageEvent;
                    if ( typeof data === 'object' && 'type' in data ) {
                        if ( data.type in this.typeListeners ) {
                            this.typeListeners[data.type]( id, data, messageEvent );
                        } else {
                            this.typeListeners.default( id, data, messageEvent );
                        }
                    } else {
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
                on( type, func, options = {} ) {
                    const { keepMessageEvent, propertyAccessor } = options;
                    this.typeListeners[type] = ( id, data, messageEvent ) => {
                        const _data = propertyAccessor ? data[propertyAccessor] : data;
                        const _args = keepMessageEvent ? [messageEvent, _data] : [_data];
                        const _value = func( ..._args );
                        if ( _value instanceof Promise ) {
                            _value.then( value => {
                                console.log(`Sending back #${id} from Worker#${threadId}`);
                                this.mainThread.postMessage( { id, data: value } );
                            } );
                        } else {
                            console.log(`Sending back #${id} from Worker#${threadId}`);
                            this.mainThread.postMessage( { id, data: _value } );
                        }
                    };
                }
            }

            ( globalThis || self || window ).workerManager = new WorkerManager();
        }.toString()})()`;
    }
    set onmessage( func ) {
        this.worker.on( 'message', func );
    }
    get onmessage() {
        return this.worker.listeners('message');
    }
    set onerror( func ) {
        this.worker.on( 'error', func );
    }
    get onerror() {
        return this.worker.listeners('error');
    }
    set onmessageerror( func ) {
        this.worker.on( 'messageerror', func );
    }
    get onmessageerror() {
        return this.worker.listeners('messageerror');
    }
    set ononline( func ) {
        this.worker.on( 'online', func );
    }
    get ononline() {
        return this.worker.listeners('online');
    }
    set onexit( func ) {
        this.worker.on( 'exit', func );
    }
    get onexit() {
        return this.worker.listeners('exit');
    }
    /**
	 * @param {Event} event
     * @param {Error} error
	 * @returns {Boolean}
	 */
    emit( event, error ) {
        return this.worker.emit( event, error );
    }
    /**
	 * Add event listener in target's event listener list
	 * @param {any} type 
	 * @param {(ev:any).any} listener 
	 * @param {boolean|AddEventListenerOptions} [options]
	 */
    addListener( type, listener ) {
        return this.worker.addListener( type, listener );
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
        return PromiseWorker.postMessage( [message, transfer], this.worker );
    }
    /**
	 * Ensure globalThis variable can handle PromiseWorker promises
	 * @returns {{resolves:{[String]:Function},rejects:{[String]:Function}}}
	 */
    static assert() {
        const self = getGlobal();
        if ( !( 'PromiseWorkers' in self ) ) {
            self.PromiseWorkers = { resolves: {}, rejects: {} };
        } else if ( !( 'resolves' in self.PromiseWorkers && 'rejects' in self.PromiseWorkers ) ) {
            self.PromiseWorkers.resolves = {};
            self.PromiseWorkers.rejects = {};
        }
        return self.PromiseWorkers;
    }
    /**
	 * Post Message to Worker within an PromiseWorker
	 * @param {[message:any,transfer?:Transferable[]]} messagePayload - Message Payload to pass through Worker.postMessage
	 * @param {Worker} worker - Worker to which post messagePayload
	 * @returns {void|Promise}
	 */
    static postMessage( messagePayload, worker ) {
        if ( worker.promise ) {
            const messageId = newUID();
            const [message, transfer] = messagePayload;
            const payload = { id: messageId, data: message };
            return new Promise( function ( resolve, reject ) {
                PromiseWorker.resolves[messageId] = resolve;
                PromiseWorker.rejects[messageId] = reject;
                if ( transfer ) {
                    worker.postMessage( payload, transfer );
                } else {
                    worker.postMessage( payload );
                }
            } );
        } else {
            worker.postMessage( ...messagePayload );
        }
    }
    /**
	 * PromiseWorker Message Reception Handling
	 * @param {MessageEvent} message - Message received by a Worker
	 * @returns {void}
	 */
    static onMessage( message ) {
        console.log( `Message #${message.id} received on main thread.` );
        const { id, err, data } = message;
        const resolve = PromiseWorker.resolves[id];
        const reject = PromiseWorker.rejects[id];
        if ( !err ) {
            if ( resolve ) {
                resolve( data );
            }
        } else if ( reject ) {
            if ( err ) {
                reject( err );
            }
        }
        PromiseWorker.delete( id );
    }
    /**
	 * @returns {{[String]:Function}}
	 */
    static get resolves() {
        return PromiseWorker.assert().resolves;
    }
    /**
	 * @returns {{[String]:Function}}
	 */
    static get rejects() {
        return PromiseWorker.assert().rejects;
    }
    /**
	 * @param {String} id - Unique messageId
	 * @returns {void}
	 */
    static delete( id ) {
        delete PromiseWorker.resolves[id];
        delete PromiseWorker.rejects[id];
    }
}

module.exports = { PromiseWorker };

