/* eslint-env browser */


export const Cookies = {
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

export class WebPTest {
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

export default {
    Cookies,
    WebPTest
};
