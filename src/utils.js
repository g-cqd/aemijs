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
    const _global = getGlobal();
    return !( 'document' in _global && typeof _global.document !== 'undefined' );
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
export function objectForEach( object, func ) {
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
export function objectMap( object, func ) {
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
        }
        else if ( mod < 36 ) {
            return String.fromCharCode( 65 + mod - 10 );
        }
        return String.fromCharCode( 97 + mod - 36 );

    }
    const src = new Uint8Array( length );
    window.crypto.getRandomValues( src );
    return Array( length )
        .fill( 0 )
        .map( ( _, i ) => intToChar( src[i] ) )
        .join( '' );
}

/**
 * Remove starting slashes
 *
 * @param {string} path
 * @returns {string}
 */
export function removeStartingSlash( path ) {
    return `${ path.replace( /^\/*/gu, '' ) }`;
}

/**
 * Remove trailing slashes
 *
 * @param {string} path
 * @returns {string}
 */
export function removeTrailingSlash( path ) {
    return `${ path.replace( /\/*$/gu, '' ) }`;
}

/**
 * Remove starting and trailing slashes
 *
 * @param {string} path
 * @returns
 */
export function removeBothSlashes( path ) {
    return `${ path.replace( /(?:^\/*|\/*$)/gu, '' ) }`;
}

/**
 * Get last path element without path nor extension
 *
 * @param {string} path - Path to file
 * @returns {string}
 */
export function getLastPath( path ) {
    return path
        .split( /\//gu )
        .pop()
        .split( /\./gu )
        .filter( str => str.length > 0 )
        .shift();
}

export default {
    getGlobal,
    getLastPath,
    isBrowser,
    isNode,
    isWorker,
    newUID,
    objectForEach,
    objectMap,
    removeBothSlashes,
    removeStartingSlash,
    removeTrailingSlash
};
