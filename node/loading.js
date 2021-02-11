const { PromiseWorker } = require( './multithread.js' );

class ImageLoader {
	constructor () {
		this.worker = new PromiseWorker.createFromFunction(
            function () {
                const { parentPort } = require( 'worker_threads' );
                parentPort.on( 'message', event => {
                    url( event.data.url, event.id ).then(
                        function ( [id, result] ) {
                            parentPort.postMessage( {
                                id: id,
                                data: { url: result || '' }
                            } );
                        }
                    );
                } );
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

module.exports = { ImageLoader };
