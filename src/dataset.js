/* eslint-env module */

export class DatasetEncoder {

    constructor() {
        this.values = [];
    }

    /**
     * @param {any} value
     * @returns {Number}
     */
    getEncoded( value ) {
        const index = this.values.indexOf( value );
        if ( index > -1 ) {
            return index;
        }
        this.length = this.values.push( value );
        return this.length - 1;

    }

    /**
     * @param {Number} encodedIndex
     * @returns {any}
     */
    getDecoded( encodedIndex ) {
        if ( this.length <= encodedIndex ) {
            throw new Error();
        }
        else {
            return this.values[encodedIndex];
        }
    }

    /**
     * @param {any} value
     * @returns {Array<Number>}
     */
    getOneHotEncoded( value ) {
        const index = this.values.indexOf( value );
        if ( index > -1 ) {
            const array = Array( this.values.length ).fill( 0 );
            array[index] = 1;
            return array;
        }
        throw new Error();
    }

    /**
     * @param {Number} index
     * @returns {Array<0|1>}
     */
    getOneHotEncodedByIndex( index ) {
        const { length } = this.values;
        if ( index >= length || index < 0 ) {
            throw new Error();
        }
        else {
            const array = Array( length ).fill( 0 );
            array[index] = 1;
            return array;
        }
    }

}

export class DatasetHeader {

    /**
     * @typedef {Object} DatasetHeaderOptions
     * @property {Object} [types]
     * @property {String|Function} types.*
     * @property {String|String[]} [encoders]
     *
     * @typedef {Object} DatasetHeaderColumnInfo
     * @property {String} key
     * @property {Number} index
     * @property {Function} [type]
     * @property {DatasetEncoder} [encoder]
     */

    /**
     * @param {String[]} array
     * @param {DatasetHeaderOptions} [options]
     */
    constructor( array, options ) {
        /** @type {Map<Number,String>} */
        this.keys = new Map();
        /** @type {Map<String,Function>} */
        this.types = new Map();
        /** @type {Map<String,Number>} */
        this.indexes = new Map();
        /** @type {Map<String,DatasetEncoder>} */
        this.encoders = new Map();

        this.nextIndex = 0;

        if ( array ) {
            this.parseFromArray( array, options );
        }
    }

    /**
     * @returns {String[]}
     */
    get columns() {
        return [ ...this.indexes.keys() ];
    }

    /**
     * @param {String} key
     * @returns {DatasetHeaderColumnInfo}
     */
    getColumnByKey( key ) {
        if ( this.indexes.has( key ) ) {
            return {
                key,
                index: this.indexes.get( key ),
                ...this.types.has( key ) ? { type: this.types.get( key ) } : {},
                ...this.encoders.has( key ) ? { encoder: this.encoders.get( key ) } : {}
            };
        }

        return undefined;

    }

    /**
     * @param {Number} index
     * @returns {DatasetHeaderColumnInfo}
     */
    getColumnByIndex( index ) {
        if ( this.keys.has( index ) ) {
            const key = this.keys.get( index );
            return {
                key,
                index,
                ...this.types.has( key ) ? { type: this.types.get( key ) } : {},
                ...this.encoders.has( key ) ? { encoder: this.encoders.get( key ) } : {}
            };
        }
        return undefined;

    }

    /**
     * @param {Number} index
     * @returns {String}
     */
    getColumnKeyByColumnIndex( index ) {
        return this.keys.get( index );
    }

    /**
     * @param {String} key
     * @returns {Number}
     */
    getColumnIndexByColumnKey( key ) {
        return this.indexes.get( key );
    }

    /**
     * @param {String} key
     * @return {DatasetEncoder}
     */
    registerColumnEncoderByColumnKey( key ) {
        const encoder = new DatasetEncoder( key );
        this.encoders.set( key, encoder );
        return encoder;
    }

    /**
     * @param {String} key
     * @returns {DatasetEncoder}
     */
    getColumnEncoderByColumnKey( key ) {
        return this.encoders.get( key );
    }

    /**
     * @param {Number} index
     * @returns {DatasetEncoder}
     */
    registerColumnEncoderByColumnIndex( index ) {
        const key = this.keys.get( index );
        const encoder = new DatasetEncoder( key );
        this.encoders.set( key, encoder );
        return encoder;
    }

    /**
     * @param {Number} index
     * @returns {DatasetEncoder}
     */
    getColumnEncoderByColumnIndex( index ) {
        return this.encoders.get( this.keys.get( index ) );
    }

    /**
     * @param {String} key
     * @returns {Function}
     */
    getColumnTypeByColumnKey( key ) {
        return this.types.get( key );
    }

    /**
     * @param {String} key
     * @param {String|Function} type
     */
    setColumnTypeByColumnKey( key, type ) {
        this.types.set( key, Dataset.parseType( type ) );
    }

    /**
     * @param {Number} index
     * @returns {Function}
     */
    getColumnTypeByColumnIndex( index ) {
        return this.types.get( this.keys.get( index ) );
    }

    /**
     * @param {Number} index
     * @param {String|Function} type
     */
    setColumnTypeByColumnIndex( index, type ) {
        this.types.set( this.keys.get( index ), Dataset.parseType( type ) );
    }

    /**
     * @param {String} key
     * @returns {Boolean}
     */
    hasColumn( key ) {
        return this.indexes.has( key );
    }

    /**
     * @param {Number} index
     * @returns {Boolean}
     */
    doesIndexExist( index ) {
        return this.keys.has( index );
    }

    /**
     * @param {String} key
     * @param {String|Function} type
     * @param {Boolean} [toBeEncoded]
     */
    addColumn( key, type, tobeEncoded = false ) {
        const index = this.nextIndex++;
        this.keys.set( index, key );
        this.indexes.set( key, index );
        this.types.set( key, Dataset.parseType( type ) );
        if ( tobeEncoded ) {
            this.encoders.set( key, new DatasetEncoder( key ) );
        }
    }

    /**
     * @param {String[]} keys
     * @returns {Number[]}
     */
    removeColumns( keys ) {
        const _keys = Array.isArray( keys ) ? keys : [ keys ];
        const oldIndexes = [];
        for ( const key of _keys ) {
            this.types.delete( key );
            this.encoders.delete( key );
            const oldIndex = this.indexes.get( key );
            this.keys.delete( oldIndex );
            this.indexes.delete( key );
            oldIndexes.push( oldIndex );
        }
        /** @type {Map<String,Number>} */
        const newIndexes = new Map();
        /** @type {Map<Number,String>} */
        const newKeys = new Map();
        let newIndex = 0;
        for ( const currentKey of this.indexes.keys() ) {
            newIndexes.set( currentKey, newIndex );
            newKeys.set( newIndex, currentKey );
            newIndex += 1;
        }
        this.indexes = newIndexes;
        this.keys = newKeys;
        this.nextIndex = newIndex;
        return oldIndexes;
    }

    /**
     * @param {String[]} array
     * @param {DatasetHeaderOptions} [options]
     * @returns {DatasetHeader}
     */
    parseFromArray( array, options = {} ) {
        const { types = {}, encoders = [] } = options;
        for ( const key of array ) {
            this.addColumn( key, types[key], encoders.includes( key ) );
        }
        this.nextIndex = array.length;
    }

    /**
     * @param {String[]} array
     * @param {DatasetHeaderOptions} [options]
     * @returns {DatasetHeader}
     */
    static parseFromArray( array, options = {} ) {
        const { types = {}, encoders = [] } = options;
        const instance = new DatasetHeader();
        for ( const key of array ) {
            instance.addColumn( key, types[key], encoders.includes( key ) );
        }
        instance.nextIndex = array.length;
        return instance;
    }

}

export class Dataset {

    /**
     * @typedef {Object} DatasetOptions
     * @property {Object} [types]
     * @property {String|Function} types.*
     * @property {String|String[]} [encoders]
     * @property {String|String[]} [excluded]
     */

    /**
     * @param {Array} elements
     * @param {Boolean} [fundamental]
     * @returns {void}
     */
    static log( elements, fundamental = true ) {
        console.log( `\n<-- ${ elements.length } ROWS -->` );
        if ( fundamental ) {
            if ( elements.length > 10 ) {
                const first = elements.slice( 0, 5 );
                const last = elements.slice( -5 );
                for ( const item of first ) {
                    if ( Array.isArray( item[0] ) ) {
                        console.log( '[ ', item.map( k =>  Array.isArray( k ) ? `\n  [ ${ k.join( ', ' ) } ]` : k  ).join( ', ' ), '\n]' );
                    }
                    else {
                        console.log( '[ ', item.join( ', ' ), ' ]' );
                    }
                }
                for ( let i = 0; i < 3; i += 1 ) {
                    console.log( '...' );
                }
                for ( const item of last ) {
                    if ( Array.isArray( item[0] ) ) {
                        console.log( '[ ', item.map( k => Array.isArray( k ) ? `\n  [ ${k.join( ', ' )} ]` : k ).join( ', ' ), '\n]' );
                    }
                    else {
                        console.log( '[ ', item.join( ', ' ), ' ]' );
                    }
                }
            }
            else {
                for ( const item of elements ) {
                    if ( Array.isArray( item[0] ) ) {
                        console.log( '[ ', item.map( k => Array.isArray( k ) ? `\n  [ ${k.join( ', ' )} ]` : k ).join( ', ' ), '\n]' );
                    }
                    else {
                        console.log( '[ ', item.join( ', ' ), ' ]' );
                    }
                }
            }
        }
        else {
            const first = elements.slice( 0, 5 );
            const last = elements.slice( -5 );
            for ( const item of first ) {
                console.log( item );
            }
            for ( let i = 0; i < 3; i += 1 ) {
                console.log( '...' );
            }
            for ( const item of last ) {
                console.log( item );
            }
        }
        console.log( `<-- ${ elements.length } ROWS -->\n` );
    }

    /**
     * @param {String} fileContentString
     * @returns {String[]}
     */
    static _getLines( fileContentString ) {
        return fileContentString.split( /\n/g );
    }

    /**
     * @param {String[]} fileRowsStrings
     * @returns {Array<String[]>}
     */
    static _getCells( fileRowsStrings ) {
        return fileRowsStrings.map( row => row.replace( /\r/g, '' ).split( /,/g )
            .map( cell => cell.trim() ) );
    }

    /**
     * @param {Array<String[]>} fileCells2d
     * @returns {Array<String[]>}
     */
    static _getNotEmptyLines( fileCells2d ) {
        return fileCells2d.filter( row => row.length > 0 && row.some( cell => !!cell === true ) );
    }

    /**
     * @param {String|ArrayBuffer} fileContent
     * @returns {Array<String[]>}
     */
    static readFile( fileContent ) {
        /** @type {String} */
        let fileContentString;
        if ( fileContent instanceof ArrayBuffer ) {
            const decoder = new TextDecoder( 'utf-8' );
            fileContentString = decoder.decode( fileContent );
        }
        return Dataset._getNotEmptyLines(
            Dataset._getCells( Dataset._getLines( fileContentString || fileContent ) )
        );
    }

    /**
     * @param {Array<Number>} indexes
     * @param {Map<any,Map>|Map<any,any[]>|Array<any,Array[]>|Array[]} mappedData
     * @param {{
     *    sortFunctionMap:Map<Number,Function>,
     *    filterFunctionMap:Map<Number,Function>,
     *    groupByFilterFunctionMap:Map<Number,Function>
     * }} [options]
     * @returns {Array|Array[]|Map<String|Number,Array|Map>}
     */
    static _flat( indexes, mappedData, options = {} ) {
        const { sortFunctionMap, filterFunctionMap, groupByFilterFunctionMap } = options;
        const [ first, ...rest ] = indexes;
        if ( first !== undefined ) {
            let flat = mappedData;
            if ( flat instanceof Map ) {
                flat = [ ...mappedData.keys() ];
                if ( sortFunctionMap && sortFunctionMap.has( first ) ) {
                    let sortFunc;
                    if ( sortFunc = sortFunctionMap.get( first ) ) {
                        flat = flat.sort( sortFunc );
                    }
                }
                flat = flat.map( key => Dataset._flat( rest, mappedData.get( key ), { sortFunctionMap, filterFunctionMap, groupByFilterFunctionMap } ) );
                if ( groupByFilterFunctionMap && groupByFilterFunctionMap.has( first ) ) {
                    let groupByFunc;
                    if ( groupByFunc = groupByFilterFunctionMap.get( first ) ) {
                        flat = flat.filter( groupByFunc );
                    }
                }
                flat = flat.flat( 1 );
                if ( filterFunctionMap && filterFunctionMap.has( first ) ) {
                    let filterFunc;
                    if ( filterFunc = filterFunctionMap.get( first ) ) {
                        flat = flat.filter( filterFunc );
                    }
                }
                return flat;
            }
            else if ( Array.isArray( flat ) ) {
                if ( filterFunctionMap && filterFunctionMap.has( first ) ) {
                    let filterFunc;
                    if ( filterFunc = filterFunctionMap.get( first ) ) {
                        flat = flat.filter( filterFunc );
                    }
                }
                if ( sortFunctionMap && sortFunctionMap.has( first ) ) {
                    let sortFunc;
                    if ( sortFunc = sortFunctionMap.get( first ) ) {
                        flat = flat.sort( ( a, b ) => sortFunc( a[first], b[first] ) );
                    }
                }
                return flat;
            }
            return mappedData;
        }
        return mappedData;
    }

    /**
     * @param {Array} rows
     * @param {Number[]} keys
     * @returns {Map<any,Map|Array>}
     */
    static _groupBy( rows, keys ) {

        const [ firstIndex, ...rest ] = keys;

        if ( firstIndex !== undefined && firstIndex >= 0 ) {

            /** @type Map */
            const result = rows.reduce( ( acc, curr ) => {
                const key = curr[firstIndex];
                const list = acc.has( key ) ? acc.get( key ) : [];
                list.push( curr );
                return acc.set( key, list );
            }, new Map() );

            if ( rest.length > 0 ) {
                for ( const [ key, values ] of result.entries() ) {
                    result.set( key, Dataset._groupBy( values, rest ) );
                }
            }

            return result;

        }
        return rows;
    }

    /**
     * @param {String|Function} [type]
     * @returns {Function}
     */
    static parseType( type ) {
        function to_same( value ) {
            return value === '' ? undefined : value;
        }
        if ( typeof type === 'function' ) {
            return function to_custom( value ) {
                return type( value );
            };
        }
        switch ( type ) {
            case 'number': {
                return function to_number( value ) {
                    const new_value = to_same( value );
                    return new_value === undefined ? NaN : isNaN( +new_value ) ? NaN : +new_value;
                };
            }
            case 'bigint': {
                return function to_bigint( value ) {
                    return BigInt( to_same( value ) );
                };
            }
            case 'boolean': {
                return function to_boolean( value ) {
                    const new_value = to_same( value );
                    return isNaN( +new_value ) ? Boolean( new_value ) : !!+new_value;
                };
            }
            case 'object': {
                return function to_object( value ) {
                    return JSON.parse( to_same( value ) );
                };
            }
            case 'string': {
                return function to_string( value ) {
                    return String( to_same( value ) );
                };
            }
            default: {
                return to_same;
            }
        }
    }

    /**
     * @param {String[]} header
     * @param {DatasetHeaderOptions} [options]
     * @returns {DatasetHeader}
     */
    static parseHeader( header, options ) {
        return new DatasetHeader( header, options );
    }

    /**
     * @param {String|RequestInfo} filePath
     * @param {DatasetOptions} [options]
     * @param {RequestInit} [requestOptions]
     * @returns {Dataset}
     */
    static load( filePath, options, requestOptions ) {
        return new Promise( ( resolve, reject ) => {
            fetch( filePath, requestOptions )
                .then( response => {
                    if ( response.status === 200 && response.ok ) {
                        response
                            .text()
                            .then( fileContent => resolve( new Dataset( fileContent, options ) ) )
                            .catch( reject );
                    }
                    else {
                        reject( response );
                    }
                } )
                .catch( reject );
        } );
    }

    /**
     * @param {String|ArrayBuffer} fileContent
     * @param {DatasetOptions} [options]
     * @returns {Dataset}
     */
    constructor( fileContent, options = {} ) {
        const { excluded, encoders, types, slice: { start, end } = {} } = options;
        const [ header, ...rows ] = Dataset.readFile( fileContent );
        this.header = Dataset.parseHeader( header, { types, encoders } );
        this.rows = this.parseRows( start || end ? rows.slice( start || 0, end ) : rows, { excluded } );
    }

    /**
     * @returns {String[]}
     */
    get columns() {
        return this.header.columns;
    }

    /**
     * @param {String} key
     * @param {String|Function} typeSetting
     */
    setType( key, typeSetting ) {
        this.header.setColumnTypeByColumnKey( key, typeSetting );
        const { index, type } = this.header.getColumnByKey( key );
        this.rows.forEach( row => {
            row[index] = type( row[index] );
        } );
    }

    /**
     * @param {Array<Array<String,String|Function>>} types
     */
    setTypes( types ) {
        for ( const [ key, typeSetting ] of types ) {
            this.setType( key, typeSetting );
        }
    }

    /**
     * @param {String} key
     * @returns {Array}
     */
    getColumn( key ) {
        if ( this.header.hasColumn( key ) ) {
            const index = this.header.getColumnIndexByColumnKey( key );
            return this.rows.map( row => row[index] );
        }
        throw new Error();
    }

    /**
     * @param {String|String[]} keys
     * @returns {void}
     */
    removeColumns( keys ) {
        const _keys = Array.isArray( keys ) ? keys : [ keys ];
        const indexesToRemove = this.header.removeColumns( _keys );
        return new Promise( resolve => {
            this.mapAsync( row => row.filter( ( _, index ) => !indexesToRemove.includes( index ) ) )
                .then( () => resolve( true ) );
        } );
    }

    /**
     * @param {String[][]} rows
     * @param {Object} [options]
     * @param {String|String[]} options.excluded
     * @returns {Array[]}
     */
    parseRows( rows, options = {} ) {
        const { excluded } = options;
        const indexesToRemove = [];
        if ( excluded ) {
            indexesToRemove.push( ...this.header.removeColumns( excluded ) );
        }
        return rows.map( cells => cells
            .filter( ( _, i ) => !indexesToRemove.includes( i ) )
            .map( ( cell, i ) => {
                const { encoder, type } = this.header.getColumnByIndex( i );
                if ( encoder ) {
                    return encoder.getEncoded( type( cell ) );
                }
                return type( cell );

            } ) );
    }

    /**
     * @param {String} key
     * @returns {Array[]}
     */
    encodeColumn( key ) {
        const column = this.header.getColumnByKey( key );
        const { index, type } = column;
        let { encoder } = column;
        if ( !encoder ) {
            encoder = this.header.registerColumnEncoderByColumnKey( key );
        }
        for ( const row of this.rows ) {
            row[index] = encoder.getEncoded( type( row[index] ) );
        }
        return this.rows;
    }

    /**
     * @param {String[]} keys
     * @returns {Array[]}
     */
    encodeColumns( keys ) {
        const values = [];
        for ( const key of keys ) {
            const column = this.header.getColumnByKey( key );
            const { index, type } = column;
            let { encoder } = column;
            if ( !encoder ) {
                encoder = this.header.registerColumnEncoderByColumnKey( key );
            }
            if ( encoder && index ) {
                values.push( [ index, type, encoder ] );
            }
        }
        for ( const [ index, type, encoder ] of values ) {
            for ( const row of this.rows ) {
                row[index] = encoder.getEncoded( type( row[index] ) );
            }
        }
        return this.rows;
    }

    /**
     * @param {String} key
     * @param {*} cell
     * @returns {Number}
     */
    encodeCell( key, cell ) {
        const { type, encoder } = this.header.getColumnByKey( key );
        if ( encoder ) {
            cell = encoder.getEncoded( type( cell ) );
            return cell;
        }
    }

    /**
     * @param {String} key
     * @param {Array} cells
     * @returns {Number[]}
     */
    encodeCells( key, cells ) {
        const { type, encoder } = this.header.getColumnByKey( key );
        if ( encoder ) {
            cells = cells.map( cell => encoder.getEncoded( type( cell ) ) );
            return cells;
        }
    }

    /**
     * @param {String} key
     * @returns {Array[]}
     */
    decodeColumn( key ) {
        const { index, encoder } = this.header.getColumnByKey( key );
        for ( const row of this.rows ) {
            row[index] = encoder.getDecoded( row[index] );
        }
        return this.rows;
    }

    /**
     * @param {String[]} keys
     * @returns {Array[]}
     */
    decodeColumns( keys ) {
        const values = [];
        for ( const key of keys ) {
            const { index, encoder } = this.header.getColumnByKey( key );
            if ( encoder ) {
                values.push( [ index, encoder ] );
            }
        }
        for ( const [ index, encoder ] of values ) {
            for ( const row of this.rows ) {
                row[index] = encoder.getDecoded( row[index] );
            }
        }
        return this.rows;
    }

    /**
     * @param {String} key
     * @param {*} cells
     * @returns {*}
     */
    decodeCell( key, cell ) {
        const encoder = this.header.getColumnEncoderByColumnKey( key );
        if ( encoder ) {
            cell = encoder.getDecoded( cell );
            return cell;
        }
    }

    /**
     * @param {String} key
     * @param {Array} cells
     * @returns {Array}
     */
    decodeCells( key, cells ) {
        const encoder = this.header.getColumnEncoderByColumnKey( key );
        if ( encoder ) {
            cells = cells.map( cell => encoder.getDecoded( cell ) );
            return cells;
        }
    }

    /**
     * @typedef {Object} DatasetColumnStatistics
     * @property {Number} *
     *
     * @param {*} object
     * @param {String|String[]} keys
     * @returns {DatasetColumnStatistics}
     */
    count( object, keys ) {
        const _keys = Array.isArray( keys ) ? keys : [ keys ];
        const indexes = {};
        const results = {};
        _keys.forEach( key => indexes[key] = this.header.getColumnIndexByColumnKey( key ) );
        _keys.forEach( key => results[key] = [] );
        this.forEach( ( element, index ) => {
            for ( const key in indexes ) {
                if ( Object.is( element[indexes[key]], object ) ) {
                    results[key].push( index );
                }
            }
        } );
        results[Symbol( 'target' )] = object;
        return results;
    }

    /**
     * @param {*} object
     * @param {String|String[]} keys
     * @returns {Promise<DatasetColumnStatistics>}
     */
    async countAsync( object, keys ) {
        const _keys = Array.isArray( keys ) ? keys : [ keys ];
        const indexes = {};
        const results = {};
        _keys.forEach( key => indexes[key] = this.header.getColumnIndexByColumnKey( key ) );
        _keys.forEach( key => results[key] = [] );
        return new Promise( resolve => {
            this.forEachAsync( ( element, index ) => {
                for ( const key in indexes ) {
                    if ( Object.is( element[indexes[key]], object ) ) {
                        results[key].push( index );
                    }
                }
            } ).then( () => {
                results[Symbol( 'target' )] = object;
                resolve( results );
            } );
        } );
    }

    /**
     * @param {String[]} keys
     * @returns {Map}
     */
    groupBy( keys ) {
        return Dataset._groupBy( this.rows, keys.some( k => typeof k === 'string' ) ? keys.map( key => this.header.getColumnIndexByColumnKey( key ) ) : keys );
    }

    /**
     * @param {Array<Array<String|Number,Function|String|undefined>>} keys
     * @param {Boolean} [inplace]
     * @returns {Array<Array>}
     */
    sortBy( keys, inplace = true ) {
        /**
         * @param {String|Function|undefined} [type]
         * @returns {Function}
         */
        function sortParse( type ) {
            if ( typeof type === 'function' ) {
                return type;
            }
            switch ( `${ type }`.toLowerCase() ) {
                case 'd':
                case 'desc':
                case 'descending':
                case 'za':
                case 'z-a': {
                    return ( a, b ) => b - a;
                }
                default: {
                    return ( a, b ) => a - b;
                }
            }

        }
        let indexes;
        let sortFunctionMap;

        if ( typeof keys === 'string' ) {
            keys = [ keys ];
        }

        if ( keys.some( k => typeof k === 'string' ) ) {
            keys = keys.map( k => typeof k === 'string' ? [this.header.getColumnIndexByColumnKey( k )] : [k] );
        }

        [ indexes, sortFunctionMap ] = ( keys.some( ( [ k ] ) => typeof k === 'string' ) ?
            keys.map( ( [ k, s ] ) => [ this.header.getColumnIndexByColumnKey( k ), sortParse( s ) ] ) :
            keys.map( ( [ i, s ] ) => [ i, sortParse( s ) ] ) )
            .reduce( ( p, c, i ) => {
                p[0][i] = c[0];
                p[1].set( c[0], c[1] );
                return p;
            }, [ [], new Map() ] );

        if ( keys.length > 1 ) {
            const groupped = Dataset._groupBy( this.rows, indexes );
            const flatted = Dataset._flat( indexes, groupped, { sortFunctionMap } );
            if ( inplace ) {
                this.rows = flatted;
                return this.rows;
            }
            return flatted;
        }
        const [ index ] = indexes;
        if ( sortFunctionMap.has( index ) ) {
            let sortFunc;
            if ( sortFunc = sortFunctionMap.get( index ) ) {
                if ( inplace ) {
                    return this.rows.sort( ( a, b ) => sortFunc( a[index], b[index] ) );
                }
                return [ ...this.rows ].sort( ( a, b ) => sortFunc( a[index], b[index] ) );

            }
        }

        return this.rows;
    }

    /**
     * @param {Array<Array<String|Number,Function>>} keyFilters
     * @param {Array<Array<String|Number,Function>>} [groupByFilters]
     * @param {Boolean} [inplace]
     * @returns {Array<Array>}
     */
    filter( keyFilters, groupByFilters, inplace = true ) {

        if ( typeof keyFilters === 'function' ) {
            return this.rows = this.rows.filter( keyFilters );
        }

        let indexes;
        let filterFunctionMap;
        let groupByFilterFunctionMap;

        [ indexes, filterFunctionMap ] = ( keyFilters.some( ( [ k ] ) => typeof k === 'string' ) ?
            keyFilters.map( ( [ k, s ] ) => [ this.header.getColumnIndexByColumnKey( k ), s ] ) :
            keyFilters.map( ( [ i, s ] ) => [ i, s ] ) )
            .reduce( ( p, [ k, f ], i ) => ( p[0][i] = k, p[1].set( k, f ), p ), [ [], new Map() ] );

        if ( groupByFilters ) {
            groupByFilterFunctionMap = ( groupByFilters.some( ( [ k ] ) => typeof k === 'string' ) ?
                groupByFilters.map( ( [ k, s ] ) => [ this.header.getColumnIndexByColumnKey( k ), s ] ) :
                groupByFilters.map( ( [ i, s ] ) => [ i, s ] ) )
                .reduce( ( p, [ k, f ] ) => p.set( k, f ), new Map() );
        }

        if ( keyFilters.length > 1 ) {
            const groupped = Dataset._groupBy( this.rows, indexes );
            const flatted = Dataset._flat( indexes, groupped, { filterFunctionMap, groupByFilterFunctionMap } );
            if ( inplace ) {
                this.rows = flatted;
                return this.rows;
            }
            return flatted;
        }
        const [ index ] = indexes;
        if ( filterFunctionMap.has( index ) ) {
            const filterFunc = filterFunctionMap.get( index );
            if ( filterFunc ) {
                const filtered = this.rows.filter( filterFunc );
                if ( inplace ) {
                    this.rows = filtered;
                    return this.rows;
                }
                return filtered;
            }
        }
        return this.rows;

    }

    /**
     * @callback callback
     * @param {Array} element
     * @param {Number} index
     * @param {Array[]} array
     * @returns {void}
     */
    /**
     * @param {callback} callback
     * @param {Array} [thisArg]
     * @returns {void}
     */
    forEach( callback, thisArg = this.rows ) {
        for ( let i = 0, l = this.rows.length; i < l; i += 1 ) {
            callback( this.rows[i], i, thisArg );
        }
    }

    /**
     * @callback callback
     * @param {Array} element
     * @param {Number} index
     * @param {Array[]} array
     * @returns {void}
     */
    /**
     * @param {callback} callback
     * @param {Array} [thisArg]
     * @returns {void}
     */
    async forEachAsync( callback, thisArg = this.rows ) {
        for ( let i = 0, l = this.rows.length; i < l; i += 1 ) {
            callback( this.rows[i], i, thisArg );
        }
    }

    /**
     * @callback callback
     * @param {Array} element
     * @param {Number} index
     * @param {Array[]} array
     */
    /**
     * @param {callback} callback
     * @param {{inplace:Boolean,thisArg:Array[]}} [options]
     * @returns {Array}
     */
    map( callback, options = {} ) {
        const { inplace, thisArg = this.rows } = options;
        if ( inplace ) {
            for ( let i = 0, l = this.rows.length; i < l; i += 1 ) {
                this.rows[i] = callback( this.rows[i], i, thisArg );
            }
            return this.rows;
        }

        const rows = [];
        for ( let i = 0, l = this.rows.length; i < l; i += 1 ) {
            rows[i] = callback( this.rows[i], i, thisArg );
        }
        return rows;

    }

    /**
     * @callback callback
     * @param {Array} element
     * @param {Number} index
     * @param {Array[]} array
     */
    /**
     * @param {callback} callback
     * @param {{inplace:Boolean,thisArg:Array[]}} [options]
     * @returns {Array}
     */
    async mapAsync( callback, options = {} ) {
        const { inplace, thisArg = this.rows } = options;
        if ( inplace ) {
            for ( let i = 0, l = this.rows.length; i < l; i += 1 ) {
                this.rows[i] = callback( this.rows[i], i, thisArg );
            }
            return this.rows;
        }

        const rows = [];
        for ( let i = 0, l = this.rows.length; i < l; i += 1 ) {
            rows[i] = callback( this.rows[i], i, thisArg );
        }
        return rows;

    }

}

export default { Dataset, DatasetEncoder, DatasetHeader };
