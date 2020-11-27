const isBrowser = typeof window !== 'undefined' || typeof self !== 'undefined';

const isNode = typeof process !== 'undefined' && process.versions && process.versions.node && typeof module === 'object';

const getGlobal = function () {
    "use strict";
    const value = globalThis || self || window || global;
    if ( value ) {
        return value;
    }
    throw new Error( 'Unable to get global object.' );
};

/**
 * 
 * @param {Object} object 
 * @param {Function} func 
 */
const forEntriesIn = function ( object, func ) {
    "use strict";
    let index = 0;
    for ( const key in object ) {
        if ( Object.prototype.hasOwnProperty.call( object, key ) ) {
            func( key, object[key], index++, object );
        }
    }
};

/**
 * 
 * @param {Object} object 
 * @returns {Array}
 */
const getEntriesIn = function ( object ) {
    "use strict";
    const entries = [];
    for ( const key in object ) {
        if ( Object.prototype.hasOwnProperty.call( object, key ) ) {
            entries.push( object[key] );
        }
    }
    return entries;
};

/**
 * 
 * @param {Number} number 
 * @returns {String}
 */
const getCharByCode = function ( number ) {
    "use strict";
    const gl = getGlobal();
    let cache;
    if ( '_char_cache_' in gl ) {
        cache = gl._char_cache_;
    }
    else {
        cache = Object.create( null );
        for ( let i = 0; i < 62; i++ ) {
			if ( i < 10 ) {
				cache[i] = 48 + i;
			} else if ( i < 36 ) {
				cache[i] = 65 + i - 10;
			} else if ( i < 62 ) {
				cache[i] = 97 + i - 36;
			}
        }
        gl._char_cache_ = cache;
    }
    return cache[number < 62 ? number : number % 62];
};

/**
 * Retrieve a unique identifier
 * @param {Number} length 
 * @returns {String}
 */
const newIdentifier = function ( length ) {
    "use strict";
    length = length || 16;
    const src = new Uint8Array( length );
    window.crypto.getRandomValues( src );
    const res = new Array( length ).fill( null );
    for ( let i = 0, l = length; i < l; i += 1 ) {
        res[i] = String.fromCharCode( getCharByCode( src[i] ) );
    }
    return res.join( '' );
};

export {
    isBrowser,
    isNode,
    getGlobal,
    forEntriesIn,
    getEntriesIn,
    getCharByCode,
    newIdentifier
};