/* eslint-env browser */

import { ExtendedWorker } from './multithread.js';
import { getGlobal } from './utils.js';

export class Wait {
	constructor () { }
	/**
	 * @returns {{
	 *   interactive: Function[],
	 *   complete: Function[],
	 *   DOMContentLoaded: Function[],
	 *   load: Function[]
	 * }}
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
	 * @param {string} type - Register an action to be fired when type is dispatched
	 * @param {{
	 *   resolve?:Function,
	 *   reject?:Function,
	 *   func?:Function,
	 *   args?:any[]
	 * }} options - Functions and args to call when action will be fired
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
		}
		if ( exec === false ) {
			registry[type].push( function () {
				return new Promise( function ( resolve_, reject_ ) {
					try {
						return resolve_( resolve( func( ...args ) ) );
					}
					catch ( _ ) {
						reject_( reject( _ ) );
					}
				} );
			} );
		}
	}
	/**
	 * @param {"interactive" | "complete" | "DOMContentLoaded" | "load"} type - EventType or Key to wait to be dispatched or already registered
	 * @returns {Promise<any[]>}
	 */
	static all( type ) {
		return Promise.all( Wait.register()[type].map( f => f() ) );
	}
	/**
	 * @param {Number} time 
	 * @returns {Promise<Number>} Await it to do whatever you want to do
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
	 * @param {Function} func 
	 * @param  {...any} funcArgs 
	 * @returns {Promise}
	 */
	static async( func, ...funcArgs ) {
		return new Promise( function ( resolve, reject ) {
			try {
				resolve( func( ...funcArgs ) );
			} catch ( _ ) {
				reject( _ );
			}
		} );
	}
	/**
	 * 
	 * @param {Function} func 
	 * @param {Number} timeout 
	 * @param  {...any} funcArgs 
	 * @returns {Promise}
	 */
	static promiseDelay( func, timeout, ...funcArgs ) {
		return new Promise( function ( resolve, reject ) {
			return setTimeout( function ( ...args ) {
				try {
					return resolve( func( ...args ) );
				}
				catch ( _ ) {
					return reject( _ );
				}
			}, timeout, ...funcArgs );
		} );
	}
	/**
	 * 
	 * @param {Function} func 
	 * @param  {...any} funcArgs 
	 * @returns {Promise}
	 */
	static interactive( func, ...funcArgs ) {
		return new Promise( function ( resolve, reject ) {
			Wait.set( 'interactive', { resolve, reject, func, args: funcArgs } );
		} );
	}
	/**
	 * 
	 * @param {Function} func 
	 * @param  {...any} funcArgs 
	 * @returns {Promise}
	 */
	static complete( func, ...funcArgs ) {
		return new Promise( function ( resolve, reject ) {
			Wait.set( 'complete', { resolve, reject, func, args: funcArgs } );
		} );
	}
	/**
	 * 
	 * @param {Function} func 
	 * @param  {...any} funcArgs 
	 * @returns {Promise}
	 */
	static DOMContentLoaded( func, ...funcArgs ) {
		return new Promise( function ( resolve, reject ) {
			Wait.set( 'DOMContentLoaded', { resolve, reject, func, args: funcArgs } );
		} );
	}
	/**
	 * 
	 * @param {Function} func 
	 * @param  {...any} funcArgs 
	 * @returns {Promise}
	 */
	static ready( func, ...funcArgs ) {
		return new Promise( function ( resolve, reject ) {
			Wait.set( 'complete', { resolve, reject, func, args: funcArgs } );
		} );
	}
	/**
	 * 
	 * @param {Function} func 
	 * @param  {...any} funcArgs 
	 * @returns {Promise}
	 */
	static load( func, ...funcArgs ) {
		return new Promise( function ( resolve, reject ) {
			Wait.set( 'complete', { resolve, reject, func, args: funcArgs } );
		} );
	}
}

export class ImageLoader {
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

	async load( options = {} ) {
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

export default { ImageLoader, Wait };
