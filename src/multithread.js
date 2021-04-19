/* eslint-env module */

import { getGlobal, newUID } from './utils.js';

export class ExtendedWorker {
	/**
	 * @param {Function|String} WorkerObject - Function or Worker file URL from which to create an ExtendedWorker
	 * @param {{
	 *  promise?:Boolean,
	 *  importScripts?:String|String[],
	 *  localImports?:String|String[],
	 *  credentials?: "include" | "omit" | "same-origin",
	 *  name?: String,
	 *  type?: "classic" | "module"
	 * }} [WorkerOptions] - Options to configure ExtendedWorker
	 */
	constructor ( WorkerObject, WorkerOptions ) {
		if ( typeof WorkerObject === 'function' ) {
			WorkerObject = ExtendedWorker.prepareFromFunction( WorkerObject, WorkerOptions );
		}
		this.worker = new Worker( WorkerObject, WorkerOptions );
		if ( WorkerOptions && 'promise' in WorkerOptions && WorkerOptions.promise === true ) {
			this.worker.promise = true;
			ExtendedWorker.assert();
			this.worker.onmessage = ExtendedWorker.onMessage;
		} else {
			this.worker.promise = false;
		}
	}
	/**
	 * Return a Worker-ready ObjectURL from a specified function string
	 * @param {String} WorkerString - Function string from which to create ExtendedWorker
	 * @param {{
	 *   promise?:Boolean,
	 *   importScripts?:String|String[],
	 *   localImports?:String|String[]
	 * }} [WorkerOptions] - Options to configure ExtendedWorker
	 * @returns {String} ObjectURL from Function String
	 */
	static prepareFromString( WorkerString, WorkerOptions ) {
		const scripts = [];
		if ( typeof WorkerOptions === 'object' ) {
			if ( 'localImports' in WorkerOptions ) {
				if ( typeof WorkerOptions.localImports === 'string' ) {
					scripts.push( `${window.location.origin}${WorkerOptions.localImports}` );
				}
				else {
					scripts.push( ...( WorkerOptions.localImports.map( path => `${window.location.origin}${path}` ) ) );
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
		}
		if ( typeof WorkerString === 'string' ) {
			const WorkerBody = `${scripts.length > 0 ? `importScripts('${scripts.join( "','" )}');\n` : ''}(${WorkerString})();`;
			const WorkerBlob = new Blob( [WorkerBody], { type: 'text/javascript' } );
			return URL.createObjectURL( WorkerBlob );
		}
		throw new Error( `WorkerString:${WorkerString} is not a string.` );
	}
	/**
	 * Return a Worker-ready ObjectURL from a specified function
	 * @param {String} WorkerString - Function from which to create ExtendedWorker
	 * @param {{
	 *   promise?:Boolean,
	 *   importScripts?:String|String[],
	 *   localImports?:String|String[]
	 * }} [WorkerOptions] - Options to configure ExtendedWorker
	 * @returns {String} ObjectURL from Function
	 */
	static prepareFromFunction( WorkerFunction, WorkerOptions ) {
		if ( typeof WorkerFunction === 'function' ) {
			return ExtendedWorker.prepareFromString( WorkerFunction.toString(), WorkerOptions );
		}
		throw new Error( `WorkerFunction:${WorkerFunction} is not a function.` );
	}
	/**
	 * Create an ExtendedWorker from a specified function string
	 * @param {String} WorkerString - Function string from which to create ExtendedWorker
	 * @param {{
	 *   promise?:Boolean,
	 *   importScripts?:String|String[],
	 *   localImports?:String|String[]
	 * }} [WorkerOptions] - Options to configure ExtendedWorker
	 * @returns {ExtendedWorker} ExtendedWorker from function string
	 */
	static createFromString( WorkerString, WorkerOptions ) {
		const scripts = [];
		if ( typeof WorkerOptions === 'object' ) {
			if ( 'localImports' in WorkerOptions ) {
				if ( typeof WorkerOptions.localImports === 'string' ) {
					scripts.push( `${window.location.origin}${WorkerOptions.localImports}` );
				}
				else {
					scripts.push( ...( WorkerOptions.localImports.map( path => `${window.location.origin}${path}` ) ) );
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
		}
		if ( typeof WorkerString === 'string' ) {
			const WorkerBody = `${scripts.length > 0 ? `importScripts('${scripts.join( "','" )}');\n` : ''}(${WorkerString})();`;
			const WorkerBlob = new Blob( [WorkerBody], { type: 'text/javascript' } );
			return new ExtendedWorker( URL.createObjectURL( WorkerBlob ), WorkerOptions );
		}
		throw new Error( `WorkerString:${WorkerString} is not a string.` );
	}
	/**
	 * Create an ExtendedWorker from a specified function
	 * @param {Function} WorkerFunction - Function from which to create ExtendedWorker
	 * @param {{
	 *   promise?:Boolean,
	 *   importScripts?:String|String[],
	 *   localImports?:String|String[]
	 * }} [WorkerOptions] - Options to configure ExtendedWorker
	 * @returns {ExtendedWorker} ExtendedWorker from function
	 */
	static createFromFunction( WorkerFunction, WorkerOptions ) {
		if ( typeof WorkerFunction === 'function' ) {
			return ExtendedWorker.createFromString( WorkerFunction.toString(), WorkerOptions );
		}
		throw new Error( `WorkerFunction:${WorkerFunction} is not a function.` );
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
		return ExtendedWorker.postMessage( [message, transfer], this.worker );
	}
	/**
	 * Ensure globalThis variable can handle ExtendedWorker promises
	 * @returns {{resolves:{[String]:Function},rejects:{[String]:Function}}}
	 */
	static assert() {
		const self = getGlobal();
		if ( !( 'ExtendedWorkers' in self ) ) {
			self.ExtendedWorkers = { resolves: {}, rejects: {} };
		} else if ( !( 'resolves' in self.ExtendedWorkers && 'rejects' in self.ExtendedWorkers ) ) {
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
			const [message, transfer] = messagePayload;
			const payload = { id: messageId, data: message };
			return new Promise( function ( resolve, reject ) {
				ExtendedWorker.resolves[messageId] = resolve;
				ExtendedWorker.rejects[messageId] = reject;
				if ( !!transfer ) {
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
		} else if ( reject ) {
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
}

export default { ExtendedWorker };
