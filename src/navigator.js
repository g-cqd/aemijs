import { getGlobal, newIdentifier } from './utils.js';

const Cookies = {
	/**
	 * @returns {String} Datetime One Year Later
	 */
	expires: function () {
		const newDate = new Date();
		const year = 365.244 * 24 * 3600 * 1000;
		newDate.setTime( newDate.getTime() + year );
		return newDate.toGMTString();
	},
	/**
	 * @param {String} cookieName 
	 * @returns {String}
	 */
	get: function ( cookieName ) {
		return new Map(
			decodeURIComponent( document.cookie )
				.split( /;/ )
				.map( str => str.trim().split( /=/ ) )
		).get( cookieName );
	},
	/**
	 * @param {String} cookieName 
	 * @returns {Boolean}
	 */
	has: function ( cookieName ) {
		return new Map(
			decodeURIComponent( document.cookie )
				.split( /;/ )
				.map( str => str.trim().split( /=/ ) )
		).has( cookieName );
	},
	/**
	 * @param {String} cookieName 
	 * @param {String|Number|Boolean} cookieValue 
	 * @param {{
	 *    expiration?: Number,
	 *    sameSite?: 'Strict' | 'Lax' | 'None',
	 *    path?: String
	 * }} [options] 
	 */
	set: function ( cookieName, cookieValue, options = {} ) {
		let { expiration, sameSite, path } = options;
		const cookieString = [`${cookieName}=${encodeURIComponent( cookieValue )}`];
		cookieString.push( `expires=${!expiration ? this.expires() : expiration}` );
		cookieString.push( `path=${path || '/'}` );
		cookieString.push( `SameSite=${sameSite || 'None'};Secure` );
		document.cookie = cookieString.join(';');
	},

	/**
	 * @param {String} cookieName 
	 */
	delete: function ( cookieName ) {
		document.cookie = `${cookieName}=;expires=0;`;
	}
};

class WebPTest {
	constructor () { }
	static get data() {
		return [
			[
				'lossy',
				'UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA'
			],
			[
				'lossless',
				'UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA=='
			],
			[
				'alpha',
				'UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAARBxAR/Q9ERP8DAABWUDggGAAAABQBAJ0BKgEAAQAAAP4AAA3AAP7mtQAAAA=='
			],
			[
				'animation',
				'UklGRlIAAABXRUJQVlA4WAoAAAASAAAAAAAAAAAAQU5JTQYAAAD/////AABBTk1GJgAAAAAAAAAAAAAAAAAAAGQAAABWUDhMDQAAAC8AAAAQBxAREYiI/gcA'
			]
		];
	}
	static save( features ) {
		const gl = getGlobal();
		gl.WebPTestResult = features.reduce( function ( acc, [feature, bool] ) {
			if ( !( feature in acc ) ) {
				acc[feature] = bool;
				return acc;
			}
		}, Object.create( null ) );
		return gl.WebPTestResult;
	}
	static imageLoading( data, feature ) {
		return new Promise( function ( resolve ) {
			const img = new Image();
			img.onload = function () {
				resolve( [feature, img.width > 0 && img.height > 0] );
			};
			img.onerror = function () {
				resolve( [feature, false] );
			};
			img.src = data;
		} );
	}
	static test() {
		const gl = getGlobal();
		return new Promise( function ( resolve ) {
			if ( 'WebPTestResult' in gl ) {
				resolve( gl.WebPTestResult );
			}
			else {
				Promise.all(
					WebPTest.data.map( function ( [feature, data] ) {
						return WebPTest.imageLoading( `data:image/webp;base64,${data}`, feature );
					} )
				).then( function ( response ) {
					resolve( WebPTest.save( response ) );
				} );
			}
		} );
	}
	static get passed() {
		const gl = getGlobal();
		let wtr;
		return new Promise( async function ( resolve ) {
			if ( 'WebPTestResult' in gl ) {
				wtr = gl.WebPTestResult;
			} else {
				wtr = await WebPTest.test();
			}
			resolve( wtr.lossy && wtr.lossless && wtr.alpha && wtr.animation );
		} );
	}
};

class ExtendedWorker {
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
		const scripts = [`${window.location.href}src/navigator.worker.js`];
		if ( typeof WorkerOptions === 'object' ) {
			if ( 'localImports' in WorkerOptions ) {
				if ( typeof WorkerOptions.localImports === 'string' ) {
					scripts.push( `${window.location.href}${WorkerOptions.localImports}` );
				}
				else {
					scripts.push( ...( WorkerOptions.localImports.map( path => `${window.location.href}${path}` ) ) );
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
			const WorkerBody = `importScripts('${scripts.join( "','" )}');\n(${WorkerString})();`;
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
		const scripts = [`${window.location.href}src/navigator.worker.js`];
		if ( typeof WorkerOptions === 'object' ) {
			if ( 'localImports' in WorkerOptions ) {
				if ( typeof WorkerOptions.localImports === 'string' ) {
					scripts.push( `${window.location.href}${WorkerOptions.localImports}` );
				}
				else {
					scripts.push( ...( WorkerOptions.localImports.map( path => `${window.location.href}${path}` ) ) );
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
			const WorkerBody = `importScripts('${scripts.join( "','" )}');\n(${WorkerString})();`;
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
	 * @returns {{resolves:{String:Function},rejects:{String:Function}}}
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
			const messageId = newIdentifier();
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
		if ( data ) {
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
	 * @returns {{String:Function}}
	 */
	static get resolves() {
		return ExtendedWorker.assert().resolves;
	}
	/**
	 * @returns {{String:Function}}
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
};

class ImageLoader {
	constructor () {
		this.worker = new ExtendedWorker(
			function () {
				self.onmessage = function ( event ) {
					url( event.data.data.url, event.data.id ).then(
						function ( [id, result] ) {
							self.postMessage( {
								id: id,
								data: { url: result || '' }
							} );
						}
					);
				};
				function url( url, id, options ) {
					options = !!options && typeof options === 'object' ? options : Object.create( null );
					return new Promise( async function ( resolve, reject ) {
						fetch( url, {
							method: 'GET',
							mode: 'cors',
							credentials: 'include',
							cache: 'default',
							...options
						} ).then( async function ( response ) {
							if ( response.status === 200 ) {
								try {
									const blob = await response.blob();
									return resolve( [id, URL.createObjectURL( blob )] );
								} catch ( _ ) {
									console.error( _ );
									return reject( [id, ''] );
								}
							}
							console.error( response );
							return reject( [id, ''] );
						} ).catch( function ( _ ) {
							console.error( _ );
							return reject( [id, ''] );
						} );
					} );
				}
			},
			{ promise: true }
		);
	}

	async load( options ) {
		options = options || Object.create( null );
		const { src, webp } = options;
		let res;
		if ( !!webp && typeof webp === 'string' ) {
			const _ = await WebPTest.passed;
			if ( _ ) {
				res = ( await this.worker.postMessage( { url: webp } ) ).url;
			} else {
				res = ( await this.worker.postMessage( { url: src } ) ).url;
			}
		} else {
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

export {
    Cookies,
    WebPTest,
    ExtendedWorker,
    ImageLoader
};

