import { getGlobal } from './utils.js';

class Cookies {
    constructor () { }
    
	static get( string ) {
        return new Map(
            decodeURIComponent( document.cookie )
                .split( /;/ )
                .map( ( string ) => string.trim().split( /=/ ) )
		).get( string );
	}
    
    static has( string ) {
		return new Map(
			decodeURIComponent( document.cookie )
                .split( /;/ )
                .map( ( string ) => string.trim().split( /=/ ) )
		).has( string );
    }
    
	static set( cookieName, cookieValue, options ) {
		options = options && typeof options === 'object' ? options : Object.create( null );
		let { expiration, sameSite } = options;
		if ( !( !!expiration ) ) {
            const newDate = new Date();
            // Let's do something really accurate
			const year = 365.244 * 24 * 3600 * 1000;
			newDate.setTime( newDate.getTime() + year );
			expiration = newDate.toGMTString();
		}
        const expirationString = `expires=${expiration}`;
        // SameSite attribute will likely be mandatory
		const sameSiteString = `SameSite=${sameSite || 'Strict'};Secure`;
		document.cookie = `${cookieName}=${encodeURIComponent(cookieValue)};path=/;${expirationString};${sameSiteString}`;
    }
    
	static delete( cookieName ) {
		const newDate = new Date();
		const year = 365.244 * 24 * 3600 * 1000;
		newDate.setTime( newDate.getTime() - year );
		const expirationString = `expires=${newDate.toGMTString()}`;
		document.cookie = `${cookieName}=;${expirationString};`;
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
						return WebPTest.imageLoading(
							`data:image/webp;base64,${data}`,
							feature
						);
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
	constructor ( WorkerObject, WorkerOptions ) {
		if ( typeof WorkerObject === 'function' ) {
			WorkerObject = ExtendedWorker.prepareFromFunction( WorkerObject );
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
	static prepareFromString( WorkerString ) {
		if ( typeof WorkerString === 'string' ) {
			const WorkerBody = '(' + WorkerString + ')()';
			const WorkerBlob = new Blob( [WorkerBody], { type: 'text/javascript' } );
			return URL.createObjectURL( WorkerBlob );
		}
		throw new Error( `WorkerString:${WorkerString} is not a string.` );
	}
	static prepareFromFunction( WorkerFunction ) {
		if ( typeof WorkerFunction === 'function' ) {
			return ExtendedWorker.prepareFromString( WorkerFunction.toString() );
		}
		throw new Error( `WorkerFunction:${WorkerFunction} is not a function.` );
	}
	static createFromString( WorkerString, WorkerOptions ) {
		if ( typeof WorkerString === 'string' ) {
			const WorkerBody = '(' + WorkerString + ')()';
			const WorkerBlob = new Blob( [WorkerBody], { type: 'text/javascript' } );
			return new ExtendedWorker( URL.createObjectURL( WorkerBlob ), WorkerOptions );
		}
		throw new Error( `WorkerString:${WorkerString} is not a string.` );
	}
	static createFromFunction( WorkerFunction, WorkerOptions ) {
		if ( typeof WorkerFunction === 'function' ) {
			return ExtendedWorker.createFromString( WorkerFunction.toString(), WorkerOptions );
		}
		throw new Error( `WorkerFunction:${WorkerFunction} is not a function.` );
	}
	get env() {
		return getGlobal().ExtendedWorkers;
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
	dispatchEvent() {
		return this.worker.dispatchEvent( ...arguments );
	}
	addEventListener() {
		return this.worker.addEventListener( ...arguments );
	}
	removeEventListener() {
		return this.worker.removeEventListener( ...arguments );
	}
	terminate() {
		return this.worker.terminate();
	}
	postMessage( data, transferableObject ) {
		return ExtendedWorker.postMessage(
			[data, transferableObject],
			this.worker
		);
	}
	static assert() {
		const self = getGlobal();
		if ( !( 'ExtendedWorkers' in self ) ) {
			self.ExtendedWorkers = Object.assign( Object.create( null ), {
				resolves: [],
				rejects: []
			} );
		} else if (
			!(
				'resolves' in self.ExtendedWorkers &&
				'rejects' in self.ExtendedWorkers
			)
		) {
			self.ExtendedWorkers.resolves = [];
			self.ExtendedWorkers.rejecs = [];
		}
	}
	static postMessage( messagePayload, worker ) {
		if ( worker.promise ) {
			const messageId = identifier();
			const [data, transferableObject] = messagePayload;
			const message = Object.assign( Object.create( null ), {
				id: messageId,
				data: data
			} );
			return new Promise( function ( resolve, reject ) {
				ExtendedWorker.resolves[messageId] = resolve;
				ExtendedWorker.rejects[messageId] = reject;
				if ( !!transferableObject ) {
					worker.postMessage( message, transferableObject );
				} else {
					worker.postMessage( message );
				}
			} );
		} else {
			worker.postMessage( ...messagePayload );
		}
	}
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
			} else {
				reject( 'Got nothing' );
			}
		}
		ExtendedWorker.delete( id );
	}
	static get resolves() {
		ExtendedWorker.assert();
		return getGlobal().ExtendedWorkers.resolves;
	}
	static get rejects() {
		ExtendedWorker.assert();
		return getGlobal().ExtendedWorkers.rejects;
	}
	static delete( id ) {
		delete ExtendedWorker.resolves[id];
		delete ExtendedWorker.rejects[id];
	}
};

class ImageLoader {
	constructor () {
		this.worker = new ExtendedWorker(
			function () {
				self.onmessage = function (event) {
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