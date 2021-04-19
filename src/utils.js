/* eslint-env module */

/**
 * Get globalThis object in any scope
 * @returns {globalThis} The globalThis object
 */
export function getGlobal() {
    return globalThis || self || window || global;
}

/**
 * Test if in Browser Environment
 * @returns {Boolean} 
 */
export function isBrowser() {
    return typeof window !== 'undefined' || typeof self !== 'undefined';
}

/**
 * Test if in Node Environment
 * @returns {Boolean}
 */
function isNode() {
    return typeof process !== 'undefined' && process.versions && process.versions.node && typeof module === 'object';
}

/**
 * Test if in standard Web Worker Environment
 * @returns {Boolean}
 */
export function isWorker() {
    return typeof this.document !== 'undefined';
}

/**
 * @callback callback
 * @param {String} key - Entry's key
 * @param {any} value - Entry's value
 * @param {Number} index - Entry's index
 * @param {Object} object - Object passed to callback
 */
/**
 * Apply a function to each entry of an object
 * @param {Object} object - Object to iterate over its entries
 * @param {callback} func - Function to apply over each entry of passed object
 * @returns {void}
 */
export function ObjectForEach( object, func ) {
    let index = 0;
    for ( const key in object ) {
        if ( Object.prototype.hasOwnProperty.call( object, key ) ) {
            func( key, object[key], index++, object );
        }
    }
}

/**
 * @callback callback
 * @param {String} key - Entry's key
 * @param {any} value - Entry's value
 * @param {Number} index - Entry's index
 * @param {Object} object - Object passed to callback
 */
/**
 * Apply a function to each entry of an object
 * @param {Object} object - Object to iterate over its entries
 * @param {callback} func - Function to apply over each entry of passed object
 * @returns {Object}
 */
export function ObjectMap( object, func ) {
    const newObject = {};
    let index = 0;
    for ( const key in object ) {
        if ( Object.prototype.hasOwnProperty.call( object, key ) ) {
            newObject[key] = func( key, object[key], index++, object );
        }
    }
    return newObject;
}

/**
 * Retrieve a unique identifier
 * 
 * @param {Number} length - Length of identifier to return
 * @returns {String} Unique Identifier
 */
export function newUID( length = 16 ) {
    /**
     * @param {Number} number 
     * @returns {String}
     */
    function intToChar( number ) {
        const abs = number < 0 ? -number : number;
        const mod = abs % 62;
        if ( mod < 10 ) {
            return String.fromCharCode( 48 + mod );
        } else if ( mod < 36 ) {
            return String.fromCharCode( 65 + mod - 10 );
        } else {
            return String.fromCharCode( 97 + mod - 36 );
        }
    }
    const src = new Uint8Array( length );
    window.crypto.getRandomValues( src );
    const res = Array( length )
        .fill( 0 )
        .map( ( _, i ) => intToChar( src[i] ) )
        .join( '' );
    return res;
}

export default {
    isBrowser,
    isWorker,
    isNode,
    getGlobal,
    ObjectForEach,
    ObjectMap,
    newUID
};
