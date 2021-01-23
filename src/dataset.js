/* eslint-env browser */

/**
 * @method getEncoded
 * @method getDecoded
 */
class DatasetEncoder {
	/**
     * @param key {String}
     * @returns {DatasetEncoder}
     */
	constructor () {
		this.values = [];
	}
	/**
     * @param value {any}
     * @returns {Number}
     */
	getEncoded( value ) {
		const index = this.values.indexOf( value );
		if ( index > -1 ) {
			return index;
		} else {
			this.length = this.values.push( value );
			return this.length - 1;
		}
	}
	/**
     * @param encodedIndex {Number}
     * @returns {any}
     */
	getDecoded( encodedIndex ) {
		if ( this.length <= encodedIndex ) {
			throw new Error();
		} else {
			return this.values[encodedIndex];
		}
	}
	/**
	 * 
	 * @param {Number} value 
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
	 * 
	 * @param {Number} index 
	 * @returns {Array<0|1>}
	 */
	getOneHotEncodedByIndex( index ) {
		const { length } = this.values;
		if ( index >= length || index < 0 ) {
			throw new Error();
		} else {
			const array = Array( length ).fill( 0 );
			array[index] = 1;
			return array;
		}
	}
}

class DatasetHeader {
	/**
     * @param array {String[]}
     * @param options {{types:{String:String|Function}}}
     */
	constructor ( array, options ) {
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
	get columns() {
		return [...this.indexes.keys()];
	}
	/**
     * @param key {String}
     * @returns {{key:String,index:Number,type?:Function,encoder?:DatasetEncoder}}
     */
	getColumnByKey( key ) {
		return this.indexes.has( key ) ? Object.assign( Object.create( null ), {
			key: key,
			index: this.indexes.get( key ),
			... this.types.has( key ) ? { type: this.types.get( key ) } : {} ,
			... this.encoders.has( key ) ? { encoder: this.encoders.get( key ) } : {} 
		} ) : undefined;
	}
	/**
     * @param index {Number}
     * @returns {{key:String,index:Number,type?:Function,encoder?:DatasetEncoder}}
     */
	getColumnByIndex( index ) {
		if ( this.keys.has( index ) ) {
			const key = this.keys.get( index );
			return Object.assign( Object.create( null ), {
				key: key,
				index: index,
				... this.types.has( key ) ? { type: this.types.get( key ) } : {} ,
				... this.encoders.has( key ) ? { encoder: this.encoders.get( key ) } : {} 
			} );
		} else {
			return undefined;
		}
	}
	/**
     * @param index {Number}
     * @returns {String}
     */
	getColumnKeyByColumnIndex( index ) {
		return this.keys.get( index );
	}
	/**
     * @param key {String}
     * @returns {Number}
     */
	getColumnIndexByColumnKey( key ) {
		return this.indexes.get( key );
	}
	/**
     * @param key {String}
     * @param encoder {Map<Number,any>}
     */
	registerColumnEncoderByColumnKey( key ) {
		const encoder = new DatasetEncoder( key );
		this.encoders.set( key, encoder );
		return encoder;
	}
	/**
     * @param key {String}
     * @returns {DatasetEncoder}
     */
	getColumnEncoderByColumnKey( key ) {
		return this.encoders.get( key );
	}
	/**
     * @param index {Number}
     */
	registerColumnEncoderByColumnIndex( index ) {
		const key = this.keys.get( index );
		const encoder = new DatasetEncoder( key );
		this.encoders.set( key, encoder );
		return encoder;
	}
	/**
     * @param index {Number}
     * @returns {DatasetEncoder}
     */
	getColumnEncoderByColumnIndex( index ) {
		return this.encoders.get( this.keys.get( index ) );
	}
	/**
     * @param key {String}
     * @returns {Function}
     */
	getColumnTypeByColumnKey( key ) {
		return this.types.get( key );
	}
	/**
     * @param key {String}
     * @param type {String|Function}
     */
	setColumnTypeByColumnKey( key, type ) {
		this.types.set( key, Dataset.parseType( type ) );
	}
	/**
     * @param index {Number}
     * @returns {Function}
     */
	getColumnTypeByColumnIndex( index ) {
		return this.types.get( this.keys.get( index ) );
	}
	/**
     * @param index {Number}
     * @param type {String|Function}
     */
	setColumnTypeByColumnIndex( index, type ) {
		this.types.set( this.keys.get( index ), Dataset.parseType( type ) );
	}
	/**
     * @param key {String}
     * @returns {Boolean}
     */
	hasColumn( key ) {
		return this.indexes.has( key );
	}
	/**
     * @param index {Number}
     * @returns {Boolean}
     */
	doesIndexExist( index ) {
		return this.keys.has( index );
	}
	/**
     * @param key {String}
     * @param type {String|Function}
     * @param toBeEncoded {Boolean}
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
     * @param keys {String[]}
     * @returns {Number[]}
     */
	removeColumns( keys ) {
		const _keys = Array.isArray( keys ) ? keys : [keys];
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
     * @param array {String[]}
     * @param options {{types:{String:String|Function},encoders:String|String[]}}
     * @returns {DatasetHeader}
     */
	parseFromArray( array, options ) {
		const { types = {}, encoders = [] } =  options || {} ;
		for ( const key of array ) {
			this.addColumn( key, types[key], encoders.includes( key ) );
		}
		this.nextIndex = array.length;
	}
	/**
     * @param array {String[]}
     * @param options {{types:{String:String|Function},encoders:String|String[]}}
     * @returns {DatasetHeader}
     */
	static parseFromArray( array, options ) {
		const { types = {}, encoders = [] } =  options || {} ;
		const instance = new DatasetHeader();
		for ( const key of array ) {
			instance.addColumn( key, types[key], encoders.includes( key ) );
		}
		instance.nextIndex = array.length;
		return instance;
	}
}

class Dataset {
	static log( elements, fundamental = true ) {
		console.log( `\n<-- ${elements.length} ROWS -->` );
		if ( fundamental ) {
			if ( elements.length > 10 ) {
				const first = elements.slice( 0, 5 );
				const last = elements.slice( -5 );
				for ( const item of first ) {
					if ( Array.isArray( item[0] ) ) {
						console.log( '[ ', item.map( k => Array.isArray( k ) ? `\n  [ ${k.join( ', ' )} ]` : k ).join( ', ' ), '\n]' );
					} else {
						console.log( '[ ', item.join( ', ' ), ' ]' );
					}
				}
				for ( let i = 0; i < 3; i += 1 ) {
					console.log( '...' );
				}
				for ( const item of last ) {
					if ( Array.isArray( item[0] ) ) {
						console.log( '[ ', item.map( k => Array.isArray( k ) ? `\n  [ ${k.join( ', ' )} ]` : k ).join( ', ' ), '\n]' );
					} else {
						console.log( '[ ', item.join( ', ' ), ' ]' );
					}
				}
			} else {
				for ( const item of elements ) {
					if ( Array.isArray( item[0] ) ) {
						console.log( '[ ', item.map( k => Array.isArray( k ) ? `\n  [ ${k.join( ', ' )} ]` : k ).join( ', ' ), '\n]' );
					} else {
						console.log( '[ ', item.join( ', ' ), ' ]' );
					}
				}
			}
		} else {
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
		console.log(`<-- ${elements.length} ROWS -->\n` );
	}
	/**
     * @param fileContentString {String}
     * @returns {String[]}
     */
	static _getLines( fileContentString ) {
		return fileContentString.split( /\n/g );
	}
	/**
     * @param fileRowsStrings {String[]}
     * @returns {Array<String[]>}
     */
	static _getCells( fileRowsStrings ) {
		return fileRowsStrings.map( row => row.replace( /\r/g, '' ).split( /,/g ).map( cell => cell.trim() ) );
	}
	/**
     * @param fileCells2d {Array<String[]>}
     * @returns {Array<String[]>}
     */
	static _getNotEmptyLines( fileCells2d ) {
		return fileCells2d.filter( row => row.length > 0 && row.some( cell => !!cell === true ) );
	}
	/**
     * @param fileContent {String|ArrayBuffer}
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
     * @param indexes {Array<Number>}
     * @param mappedData {Map<any,Map>|Map<any,any[]>|Array<any,Array[]>|Array[]}
     * @param sortFunctionMap {Map<Number,Function>}
     */
	static _flat( indexes, mappedData, { sortFunctionMap, filterFunctionMap, groupByFilterFunctionMap } = {} ) {
		const [first, ...rest] = indexes;
		if ( first !== undefined ) {
			let flat = mappedData;
			if ( flat instanceof Map ) {
				flat = [... mappedData.keys() ];
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
			} else if ( Array.isArray( flat ) ) {
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
     * @param rows {Array}
     * @param keys {Number[]}
     * @returns {Map<any,Map|Array>}
     */
	static _groupBy( rows, keys ) {

		const [firstIndex, ...rest] = keys;

		if ( firstIndex !== undefined && firstIndex >= 0 ) {
            
			/** @type Map */
			const result = rows.reduce( function ( acc, curr ) {
				const key = curr[firstIndex];
				const list = acc.has( key ) ? acc.get( key ) : [];
				list.push( curr );
				return acc.set( key, list );
			}, new Map() );

			if ( rest.length > 0 ) {
				for ( const [key, values] of result.entries() ) {
					result.set( key, Dataset._groupBy( values, rest ) );
				}
			}

			return result;

		}
		return rows;
	}
	/**
     * @param type {String|Function}
     * @returns {Function}
     */
	static parseType( type ) {
		function to_same( value ) {
			return value === '' ? undefined : value;
		}
		if ( typeof type === 'function' ) {
			return function to_custom( value ) { return type( value ); };
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
				return isNaN( +new_value ) ? Boolean( new_value ) : !! +new_value;
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
     * @param header {String[]}
     * @param options {{types:{String:String|Function}}}
     * @returns {DatasetHeader}
     */
	static parseHeader( header, options ) {
		return new DatasetHeader( header, options );
	}
	/**
     * @param {String|RequestInfo} filePath
     * @param {{encoders:String[],excluded:String|String[],types:{String:String|Function}}} options
	 * @param {RequestInit} requestOptions
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
					} else {
						reject( response );
					}
				} )
				.catch( reject );
		} );
	}
	/**
     * @param fileContent {String}
     * @param options {{encoders:String[],excluded:String|String[],types:{String:String|Function}}}
     * @returns {Dataset}
     */
	constructor ( fileContent, options ) {
		const { excluded, encoders, types, slice: { start, end } = {} } = options || {};
		const [header, ...rows] = Dataset.readFile( fileContent );
		this.header = Dataset.parseHeader( header, { types, encoders } );
		this.rows = this.parseRows( start || end ? rows.slice( start || 0, end ) : rows, { excluded } );
	}
	get columns() {
		return this.header.columns;
	}
	/**
     * @param key {String}
     * @param typeSetting {String|Function}
     */
	setType( key, typeSetting ) {
		this.header.setColumnTypeByColumnKey( key, typeSetting );
		const { index, type } = this.header.getColumnByKey( key );
		this.rows.forEach( row => {
			row[index] = type( row[index] );
		} );
	}
	/**
     * @param types {Array<Array<String,String|Function>>}
     */
	setTypes( types ) {
		for ( const [key, typeSetting] of types ) {
			this.setType( key, typeSetting );
		}
	}
	/**
     * @param key {String}
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
     * @param key {String|String[]}
     * @returns {void}
     */
	removeColumns( keys ) {
		const _keys = Array.isArray( keys ) ? keys : [keys];
		const indexesToRemove = this.header.removeColumns( keys );
		return new Promise( resolve => {
			this.mapAsync( row => row.filter( ( _, index ) => !indexesToRemove.includes( index ) ) )
				.then( () => {
					resolve( true );
				} );
		} );
	}
	/**
     * @param rows {Array<String[]>}
     * @param options {{excluded:String|String[]}}
     * @returns {Array<Array>}
     */
	parseRows( rows, options ) {
		const { excluded } =  options || {} ;
		const indexesToRemove = [];
		if ( excluded ) {
			indexesToRemove.push( ...this.header.removeColumns( excluded ) );
		}
		return rows.map( cells => {
			return cells
				.filter( ( _, i ) => !indexesToRemove.includes( i ) )
				.map( ( cell, i ) => {
					const { encoder, type } = this.header.getColumnByIndex( i );
					if ( encoder ) {
						return encoder.getEncoded( type( cell ) );
					} else {
						return type( cell );
					}
				} );
		} );
	}
	/**
     * @param key {String}
     * @returns {Array<Array>}
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
     * @param keys {String[]}
     * @returns {Array<Array>}
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
				values.push( [index, type, encoder] );
			}
		}
		for ( const [index, type, encoder] of values ) {
			for ( const row of this.rows ) {
				row[index] = encoder.getEncoded( type( row[index] ) );
			}
		}
		return this.rows;
	}
	/**
     * @param key {String}
     * @param cell {any}
     * @returns {Number}
     */
	encodeCell( key, cell ) {
		const { type, encoder } = this.header.getColumnByKey( key );
		if ( encoder ) {
			return cell = encoder.getEncoded( type( cell ) );
		}
	}
	/**
     * @param key {String}
     * @param cells {Array}
     * @returns {Array<Number>}
     */
	encodeCells( key, cells ) {
		const { type, encoder } = this.header.getColumnByKey( key );
		if ( encoder ) {
			return cells = cells.map( cell => encoder.getEncoded( type( cell ) ) );
		}
	}
	/**
     * @param key {String}
     * @returns {Array<Array>}
     */
	decodeColumn( key ) {
		const { index, encoder } = this.header.getColumnByKey( key );
		for ( const row of this.rows ) {
			row[index] = encoder.getDecoded( row[index] );
		}
		return this.rows;
	}
	/**
     * @param keys {String[]}
     * @returns {Array<Array>}
     */
	decodeColumns( keys ) {
		const values = [];
		for ( const key of keys ) {
			const { index, encoder } = this.header.getColumnByKey( key );
			if ( encoder ) {
				values.push( [index, encoder] );
			}
		}
		for ( const [index, encoder] of values ) {
			for ( const row of this.rows ) {
				row[index] = encoder.getDecoded( row[index] );
			}
		}
		return this.rows;
	}
	/**
     * @param key {String}
     * @param cells {any}
     * @returns {any}
     */
	decodeCell( key, cell ) {
		const encoder = this.header.getColumnEncoderByColumnKey( key );
		if ( encoder ) {
			return cell = encoder.getDecoded( cell );
		}
	}
	/**
     * @param key {String}
     * @param cells {Array}
     * @returns {Array}
     */
	decodeCells( key, cells ) {
		const encoder = this.header.getColumnEncoderByColumnKey( key );
		if ( encoder ) {
			return cells = cells.map( cell => encoder.getDecoded( cell ) );
		}
	}
	/**
	 * @param {any} object
	 * @param {String|String[]} keys 
	 * @returns
	 */
	count( object, keys ) {
		const _keys = Array.isArray( keys ) ? keys : [keys];
		const indexes = Object.create(null);
		const results = Object.create(null);
		_keys.forEach( key => indexes[key] = this.header.getColumnIndexByColumnKey( key ) );
		_keys.forEach( key => results[key] = [] );
		this.forEach( (element, index) => {
			for ( const key in indexes ) {
				if ( Object.is( element[indexes[key]], object ) ) {
					results[key].push( index );
				}
			}
		} );
		results[Symbol('target')] = object;
		return results;
	}
	async countAsync( object, keys ) {
		const _keys = Array.isArray( keys ) ? keys : [keys];
		const indexes = Object.create(null);
		const results = Object.create(null);
		_keys.forEach( key => indexes[key] = this.header.getColumnIndexByColumnKey( key ) );
		_keys.forEach( key => results[key] = [] );
		return new Promise( resolve => {
			this.forEachAsync( (element,index) => {
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
     * @param keys {String[]}
     * @param convertToArrays {Boolean?}
     * @returns {Map}
     */
	groupBy( keys ) {
		return Dataset._groupBy( this.rows, keys.some( k => typeof k === 'string' ) ? keys.map( key => this.header.getColumnIndexByColumnKey( key ) ) : keys );
	}
	/**
     * @param keys {Array<Array<String|Number,Function|String|undefined>>}
     * @returns {Array<Array>}
     */
	sortBy( keys, inplace = true ) {
		/**
         * @param type {String|Function|undefined}
         * @returns {Function}
         */
		function sortParse( type ) {
			if ( typeof type === 'function' ) {
				return type;
			} else {
				switch ( `${type}`.toLowerCase() ) {
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
		}
		let indexes;
		let sortFunctionMap;

		if ( typeof keys === 'string' ) {
			keys = [keys];
		}

		if ( keys.some( k => typeof k === 'string' ) ) {
			keys = keys.map( k => typeof k === 'string' ? [this.header.getColumnIndexByColumnKey( k )] : [k] );
		}

		[indexes, sortFunctionMap] = ( keys.some( ( [k] ) => typeof k === 'string' )
			? keys.map( ( [k, s] ) => [this.header.getColumnIndexByColumnKey( k ), sortParse( s )] )
			: keys.map( ( [i, s] ) => [i, sortParse( s )] ) )
			.reduce( ( p, c, i ) => {
				p[0][i] = c[0];
				p[1].set( c[0], c[1] );
				return p;
			}, [[], new Map()] );

		if ( keys.length > 1 ) {
			const groupped = Dataset._groupBy( this.rows, indexes );
			const flatted = Dataset._flat( indexes, groupped, { sortFunctionMap } );
			if ( inplace ) {
				this.rows = flatted;
				return this.rows;
			}
			return flatted;
		} else {
			const [index] = indexes;
			if ( sortFunctionMap.has( index ) ) {
				let sortFunc;
				if ( sortFunc = sortFunctionMap.get( index ) ) {
					if ( inplace ) {
						return this.rows.sort( ( a, b ) => sortFunc( a[index], b[index] ) );
					} else {
						return [...this.rows].sort( ( a, b ) => sortFunc( a[index], b[index] ) );
					}
				}
			}
		}
		return this.rows;
	}
	/**
     * @param keyFilters {Array<Array<String|Number,Function>>}
     * @param groupByFilters {Array<Array<String|Number,Function>>}
     * @returns {Array<Array>}
     */
	filter( keyFilters, groupByFilters, inplace = true ) {

		if ( typeof keyFilters === 'function' ) {
			return  this.rows = this.rows.filter( keyFilters ) ;
		}

		let indexes;
		let filterFunctionMap;
		let groupByFilterFunctionMap;

		[indexes, filterFunctionMap] = ( keyFilters.some( ( [k] ) => typeof k === 'string' )
			? keyFilters.map( ( [k, s] ) => [this.header.getColumnIndexByColumnKey( k ), s] )
			: keyFilters.map( ( [i, s] ) => [i, s] ) )
			.reduce( ( p, [k, f], i ) => ( p[0][i] = k, p[1].set( k, f ), p ), [[], new Map()] );

		if ( groupByFilters ) {
			groupByFilterFunctionMap = ( groupByFilters.some( ( [k] ) => typeof k === 'string' )
				? groupByFilters.map( ( [k, s] ) => [this.header.getColumnIndexByColumnKey( k ), s] )
				: groupByFilters.map( ( [i, s] ) => [i, s] ) )
				.reduce( ( p, [k, f] ) => p.set( k, f ), new Map() );
		}

		if ( keyFilters.length > 1 ) {
			const groupped = Dataset._groupBy( this.rows, indexes );
			const flatted = Dataset._flat( indexes, groupped, { filterFunctionMap, groupByFilterFunctionMap } );
			if ( inplace ) {
				this.rows = flatted;
				return this.rows;
			}
			return flatted;
		} else {
			const [index] = indexes;
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
	 * @returns {void}
	 */
	forEach( callback ) {
		for ( let i = 0, l = this.rows.length; i < l; i += 1 ) {
			callback( this.rows[i], i, this.rows );
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
	 * @returns {void}
	 */
	async forEachAsync( callback ) {
		for ( let i = 0, l = this.rows.length; i < l; i += 1 ) {
			callback( this.rows[i], i, this.rows );
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
	 * @returns {void}
	 */
	map( callback ) {
		for ( let i = 0, l = this.rows.length; i < l; i += 1 ) {
			this.rows[i] = callback( this.rows[i], i, this.rows );
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
	 * @returns {void}
	 */
	async mapAsync( callback ) {
		for  ( let i = 0, l = this.rows.length; i < l; i += 1 ) {
			this.rows[i] = callback( this.rows[i], i, this.rows );
		}
	}

	forEachIterator( options ) {
		if ( options ) {
			const { filterBy, groupBy, ignore } = options;
			const groupByArray = typeof groupBy === 'string' ? [groupBy] : groupBy;
			const index_lookup = [];
			const deep_index_lookup = [];
			const filtered_rows = [];
			const filtered_map = new Map();
			let index = 0;
			for ( const row of this.rows ) {
				if ( filterBy ) {
					if ( filterBy.every( ( [prop, value] ) => filterBy_func( prop, value, row ) ) ) {
						if ( groupBy ) {
							deep_index_lookup.push( ...groupBy_func( filtered_map, row, ...groupByArray ) );
							index_lookup.push( index );
						} else {
							index_lookup.push( index );
							filtered_rows.push( row );
						}
					}
				} else if ( groupBy ) {
					deep_index_lookup.push( [...groupBy_func( filtered_map, row, ...groupByArray ), index] );
					index_lookup.push( index );
				}
				index++;
			}
			if ( groupBy ) {
				let index = 0;
				const _this = this;
				const limit = deep_index_lookup.length;
				return  {
					[Symbol.iterator]: () => ( {
						next: () => ( {
							value: index < limit ? Object.assign( Object.create( null ), {
								row: _this.rows[index_lookup[index]],
								... ignore && ignore.includes( 'groups' ) ? {} : { groups: deep_map_get( filtered_map, _this.rows[index_lookup[index]], ...groupByArray ) } ,
								... ignore && ignore.includes( 'indices' ) ? {} : { indices: deep_index_lookup[index] } 
							} ) : undefined, done: !( index++ < limit )
						} )
					} )
				} ;
			} else if ( filterBy ) {
				let index = 0;
				const _this = this;
				const limit = filtered_rows.length;
				return  {
					[Symbol.iterator]: () => ( {
						next: () => ( {
							value: index < limit ? Object.assign( Object.create( null ), {
								row: _this.rows[index_lookup[index]],
								index: index_lookup[index],
								filtered_rows: filtered_rows,
								filtered_index: index
							} ) : undefined, done: !( index++ < limit )
						} )
					} )
				} ;
			} else {
				let index = 0;
				const limit = this.rows.length;
				return  { [Symbol.iterator]: () => ( { next: () => ( { value: index < limit ? [this.rows[index], index, this.rows] : undefined, done: !( index++ < limit ) } ) } ) } ;
			}
		}
	}
}

export { Dataset, DatasetEncoder, DatasetHeader };
