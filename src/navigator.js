/* eslint-env module */


export const Cookies = {
    /**
     * @returns {String} Datetime One Year Later
     */
    expires() {
        const newDate = new Date();
        const year = 365.244 * 24 * 3600 * 1000;
        newDate.setTime( newDate.getTime() + year );
        return newDate.toGMTString();
    },
    /**
     * @param {String} cookieName - Name of the cookie
     * @returns {String} Cookie Value
     */
    get( cookieName ) {
        return new Map(
            decodeURIComponent( document.cookie )
                .split( /;/u )
                .map( str => str.trim().split( /[=]/u ) )
        ).get( cookieName );
    },
    /**
     * @param {String} cookieName - Name of the cookie
     * @returns {Boolean} - True if cookie exists
     */
    has( cookieName ) {
        return new Map(
            decodeURIComponent( document.cookie )
                .split( /;/u )
                .map( str => str.trim().split( /[=]/u ) )
        ).has( cookieName );
    },
    /**
     * @typedef {Object} CookieOptions - Options for the cookie
     * @property {Number} expiration - Number of days until expiration
     * @property {'Strict'|'Lax'|'None'} sameSite - Cookie SameSite policy
     * @property {String} path - Cookie path
     */
    /**
     * @param {String} cookieName - Name of the cookie
     * @param {String|Number|Boolean} cookieValue - Value of the cookie
     * @param {CookieOptions} [options] - Options to set with the cookie
     */
    set( cookieName, cookieValue, options = {} ) {
        const newExpiration = this.expires();
        const {
            expiration = newExpiration,
            sameSite = 'Strict',
            path = '/'
        } = options;
        const cookieString = [ `${ cookieName }=${ encodeURIComponent( cookieValue ) }` ];
        cookieString.push( `expires=${ expiration }` );
        cookieString.push( `path=${ path }` );
        cookieString.push( `SameSite=${ sameSite };Secure` );
        document.cookie = cookieString.join( ';' );
    },

    /**
     * @param {String} cookieName - Name of the cookie
     */
    delete( cookieName ) {
        document.cookie = `${ cookieName }=;expires=0;`;
    }
};

export class WebPTest {

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
        gl.WebPTestResult = features.reduce( ( acc, [ feature, bool ] ) => {
            if ( !( feature in acc ) ) {
                acc[feature] = bool;
            }
            return acc;
        }, Object.create( null ) );
        return gl.WebPTestResult;
    }

    static imageLoading( data, feature ) {
        return new Promise( resolve => {
            const img = new Image();
            img.onload = function onload() {
                resolve( [ feature, img.width > 0 && img.height > 0 ] );
            };
            img.onerror = function onerror() {
                resolve( [ feature, false ] );
            };
            img.src = data;
        } );
    }

    static test() {
        const gl = getGlobal();
        return new Promise( resolve => {
            if ( 'WebPTestResult' in gl ) {
                resolve( gl.WebPTestResult );
            }
            else {
                Promise.all(
                    WebPTest.data.map( ( [ feature, data ] ) => WebPTest.imageLoading( `data:image/webp;base64,${ data }`, feature ) )
                ).then( response => {
                    resolve( WebPTest.save( response ) );
                } );
            }
        } );
    }

    static get passed() {
        const gl = getGlobal();
        let wtr;
        return new Promise( async resolve => {
            if ( 'WebPTestResult' in gl ) {
                wtr = gl.WebPTestResult;
            }
            else {
                wtr = await WebPTest.test();
            }
            resolve( wtr.lossy && wtr.lossless && wtr.alpha && wtr.animation );
        } );
    }

}

export default {
    Cookies,
    WebPTest
};
