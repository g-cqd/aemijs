/**
 * Get globalThis object in any scope
 * @returns {globalThis} The globalThis object
 */
function getGlobal() {
    return globalThis || self || window || global;
};

/**
 * Test if in Browser Environment
 * @returns {Boolean}
 */
function isBrowser() {
    return typeof window !== 'undefined' || typeof self !== 'undefined';
};

/**
 * Test if in Node Environment
 * @returns {Boolean}
 */
function isNode() {
    return typeof process !== 'undefined' && process.versions && process.versions.node && typeof module === 'object';
};

/**
 * Test if in standard Web Worker Environment
 * @returns {Boolean}
 */
function isWorker() {
    return typeof self !== 'undefined' && getGlobal() === self;
};

/**
 * @callback callback
 * @param {String|Number|Symbol} key - Entry's key
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
function forEntriesIn( object, func ) {
    let index = 0;
    for ( const key in object ) {
        if ( Object.prototype.hasOwnProperty.call( object, key ) ) {
            func( key, object[key], index++, object );
        }
    }
};

/**
 * 
 * @param {Object} object - Object to get entries from
 * @returns {Array}
 */
const getEntriesIn = function ( object ) {
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
function getCharByCode( number ) {
    /** @constant */
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
 * @param {Number} length - Length of identifier to return
 * @returns {String} - Unique Identifier
 */
const newIdentifier = function ( length = 16 ) {
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
    isWorker,
    getGlobal,
    forEntriesIn,
    getEntriesIn,
    getCharByCode,
    newIdentifier
};
