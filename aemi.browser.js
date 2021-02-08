var Aemi = (function (exports) {
    'use strict';

    /**
     * Get globalThis object in any scope
     * @returns {globalThis} The globalThis object
     */
    function getGlobal$1() {
        return globalThis || self || window || global;
    }

    /**
     * Test if in Browser Environment
     * @returns {Boolean} 
     */
    function isBrowser() {
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
    function isWorker() {
        return typeof self !== 'undefined' && getGlobal$1() === self;
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
    function ObjectForEach$1( object, func ) {
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
     * @returns {void}
     */
    function ObjectMap( object, func ) {
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
     * @param {Number} length - Length of identifier to return
     * @returns {String} Unique Identifier
     */
    function newUID( length = 16 ) {
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

    var utils = {
        isBrowser,
        isWorker,
        isNode,
        getGlobal: getGlobal$1,
        ObjectForEach: ObjectForEach$1,
        ObjectMap,
        newUID
    };

    /* eslint-env browser */

    class ExtendedWorker {
    	/**
    	 * @param {Function|String} WorkerObject - Function or Worker file URL from which to create an ExtendedWorker
    	 * @param {{
    	 *  promise?:Boolean,
    	 *  importScripts?:String|String[],
    	 *  localImports?:String|String[],
    	 *  credentials?: "include" | "omit" | "same-origin",
    	 *  name?: String,
    	 *  type?: "classic" | "module"
    	 * }} [WorkerOptions] - Options to configure ExtendedWorker
    	 */
    	constructor ( WorkerObject, WorkerOptions ) {
    		if ( typeof WorkerObject === 'function' ) {
    			WorkerObject = ExtendedWorker.prepareFromFunction( WorkerObject, WorkerOptions );
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
    	/**
    	 * Return a Worker-ready ObjectURL from a specified function string
    	 * @param {String} WorkerString - Function string from which to create ExtendedWorker
    	 * @param {{
    	 *   promise?:Boolean,
    	 *   importScripts?:String|String[],
    	 *   localImports?:String|String[]
    	 * }} [WorkerOptions] - Options to configure ExtendedWorker
    	 * @returns {String} ObjectURL from Function String
    	 */
    	static prepareFromString( WorkerString, WorkerOptions ) {
    		const scripts = [];
    		if ( typeof WorkerOptions === 'object' ) {
    			if ( 'localImports' in WorkerOptions ) {
    				if ( typeof WorkerOptions.localImports === 'string' ) {
    					scripts.push( `${window.location.origin}${WorkerOptions.localImports}` );
    				}
    				else {
    					scripts.push( ...( WorkerOptions.localImports.map( path => `${window.location.origin}${path}` ) ) );
    				}
    			}
    			if ( 'importScripts' in WorkerOptions ) {
    				if ( typeof WorkerOptions.importScripts === 'string' ) {
    					scripts.push( WorkerOptions.importScripts );
    				}
    				else {
    					scripts.push( ...WorkerOptions.importScripts );
    				}
    			}
    		}
    		if ( typeof WorkerString === 'string' ) {
    			const WorkerBody = `${scripts.length > 0 ? `importScripts('${scripts.join( "','" )}');\n` : ''}(${WorkerString})();`;
    			const WorkerBlob = new Blob( [WorkerBody], { type: 'text/javascript' } );
    			return URL.createObjectURL( WorkerBlob );
    		}
    		throw new Error( `WorkerString:${WorkerString} is not a string.` );
    	}
    	/**
    	 * Return a Worker-ready ObjectURL from a specified function
    	 * @param {String} WorkerString - Function from which to create ExtendedWorker
    	 * @param {{
    	 *   promise?:Boolean,
    	 *   importScripts?:String|String[],
    	 *   localImports?:String|String[]
    	 * }} [WorkerOptions] - Options to configure ExtendedWorker
    	 * @returns {String} ObjectURL from Function
    	 */
    	static prepareFromFunction( WorkerFunction, WorkerOptions ) {
    		if ( typeof WorkerFunction === 'function' ) {
    			return ExtendedWorker.prepareFromString( WorkerFunction.toString(), WorkerOptions );
    		}
    		throw new Error( `WorkerFunction:${WorkerFunction} is not a function.` );
    	}
    	/**
    	 * Create an ExtendedWorker from a specified function string
    	 * @param {String} WorkerString - Function string from which to create ExtendedWorker
    	 * @param {{
    	 *   promise?:Boolean,
    	 *   importScripts?:String|String[],
    	 *   localImports?:String|String[]
    	 * }} [WorkerOptions] - Options to configure ExtendedWorker
    	 * @returns {ExtendedWorker} ExtendedWorker from function string
    	 */
    	static createFromString( WorkerString, WorkerOptions ) {
    		const scripts = [];
    		if ( typeof WorkerOptions === 'object' ) {
    			if ( 'localImports' in WorkerOptions ) {
    				if ( typeof WorkerOptions.localImports === 'string' ) {
    					scripts.push( `${window.location.origin}${WorkerOptions.localImports}` );
    				}
    				else {
    					scripts.push( ...( WorkerOptions.localImports.map( path => `${window.location.origin}${path}` ) ) );
    				}
    			}
    			if ( 'importScripts' in WorkerOptions ) {
    				if ( typeof WorkerOptions.importScripts === 'string' ) {
    					scripts.push( WorkerOptions.importScripts );
    				}
    				else {
    					scripts.push( ...WorkerOptions.importScripts );
    				}
    			}
    		}
    		if ( typeof WorkerString === 'string' ) {
    			const WorkerBody = `${scripts.length > 0 ? `importScripts('${scripts.join( "','" )}');\n` : ''}(${WorkerString})();`;
    			const WorkerBlob = new Blob( [WorkerBody], { type: 'text/javascript' } );
    			return new ExtendedWorker( URL.createObjectURL( WorkerBlob ), WorkerOptions );
    		}
    		throw new Error( `WorkerString:${WorkerString} is not a string.` );
    	}
    	/**
    	 * Create an ExtendedWorker from a specified function
    	 * @param {Function} WorkerFunction - Function from which to create ExtendedWorker
    	 * @param {{
    	 *   promise?:Boolean,
    	 *   importScripts?:String|String[],
    	 *   localImports?:String|String[]
    	 * }} [WorkerOptions] - Options to configure ExtendedWorker
    	 * @returns {ExtendedWorker} ExtendedWorker from function
    	 */
    	static createFromFunction( WorkerFunction, WorkerOptions ) {
    		if ( typeof WorkerFunction === 'function' ) {
    			return ExtendedWorker.createFromString( WorkerFunction.toString(), WorkerOptions );
    		}
    		throw new Error( `WorkerFunction:${WorkerFunction} is not a function.` );
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
    	/**
    	 * @param {Event} event 
    	 * @returns {Boolean}
    	 */
    	dispatchEvent( event ) {
    		return this.worker.dispatchEvent( event );
    	}
    	/**
    	 * Add event listener in target's event listener list
    	 * @param {any} type 
    	 * @param {(ev:any).any} listener 
    	 * @param {boolean|AddEventListenerOptions} [options]
    	 */
    	addEventListener( type, listener, options ) {
    		return this.worker.addEventListener( type, listener, options );
    	}
    	/**
    	 * Removes the event listener in target's event listener list with the same type, callback, and options.
    	 * @param {any} type 
    	 * @param {(ev:any).any} listener 
    	 * @param {boolean|EventListenerOptions} [options]
    	 */
    	removeEventListener( type, listener, options ) {
    		this.worker.removeEventListener( type, listener, options );
    	}
    	terminate() {
    		this.worker.terminate();
    	}
    	/**
    	 * Post message to Worker
    	 * @param {any} message - Message to pass to Worker
    	 * @param {Transferable[]} [transfer] - Transferable Object List to pass to Worker
    	 * @returns {void|Promise}
    	 */
    	postMessage( message, transfer ) {
    		return ExtendedWorker.postMessage( [message, transfer], this.worker );
    	}
    	/**
    	 * Ensure globalThis variable can handle ExtendedWorker promises
    	 * @returns {{resolves:{[String]:Function},rejects:{[String]:Function}}}
    	 */
    	static assert() {
    		const self = getGlobal$1();
    		if ( !( 'ExtendedWorkers' in self ) ) {
    			self.ExtendedWorkers = { resolves: {}, rejects: {} };
    		} else if ( !( 'resolves' in self.ExtendedWorkers && 'rejects' in self.ExtendedWorkers ) ) {
    			self.ExtendedWorkers.resolves = {};
    			self.ExtendedWorkers.rejects = {};
    		}
    		return self.ExtendedWorkers;
    	}
    	/**
    	 * Post Message to Worker within an ExtendedWorker
    	 * @param {[message:any,transfer?:Transferable[]]} messagePayload - Message Payload to pass through Worker.postMessage
    	 * @param {Worker} worker - Worker to which post messagePayload
    	 * @returns {void|Promise}
    	 */
    	static postMessage( messagePayload, worker ) {
    		if ( worker.promise ) {
    			const messageId = newUID();
    			const [message, transfer] = messagePayload;
    			const payload = { id: messageId, data: message };
    			return new Promise( function ( resolve, reject ) {
    				ExtendedWorker.resolves[messageId] = resolve;
    				ExtendedWorker.rejects[messageId] = reject;
    				if ( !!transfer ) {
    					worker.postMessage( payload, transfer );
    				} else {
    					worker.postMessage( payload );
    				}
    			} );
    		} else {
    			worker.postMessage( ...messagePayload );
    		}
    	}
    	/**
    	 * ExtendedWorker Message Reception Handling
    	 * @param {MessageEvent} message - Message received by a Worker
    	 * @returns {void}
    	 */
    	static onMessage( message ) {
    		const { id, err, data } = message.data;
    		const resolve = ExtendedWorker.resolves[id];
    		const reject = ExtendedWorker.rejects[id];
    		if ( !err ) {
    			if ( resolve ) {
    				resolve( data );
    			}
    		} else if ( reject ) {
    			if ( err ) {
    				reject( err );
    			}
    		}
    		ExtendedWorker.delete( id );
    	}
    	/**
    	 * @returns {{[String]:Function}}
    	 */
    	static get resolves() {
    		return ExtendedWorker.assert().resolves;
    	}
    	/**
    	 * @returns {{[String]:Function}}
    	 */
    	static get rejects() {
    		return ExtendedWorker.assert().rejects;
    	}
    	/**
    	 * @param {String} id - Unique messageId
    	 * @returns {void}
    	 */
    	static delete( id ) {
    		delete ExtendedWorker.resolves[id];
    		delete ExtendedWorker.rejects[id];
    	}
    }

    var multithread = { ExtendedWorker };

    /* eslint-env browser */

    class MarkdownParser {
        /**
         * @param {String} MarkdownParserLibraryURL 
         */
        constructor ( MarkdownParserLibraryURL ) {
            this.worker = new ExtendedWorker(
                function () {
                    globalThis.onmessage = function ( event ) {
                        globalThis.postMessage( { id: event.data.id, data: { data: marked( event.data.data ) } } );
                    };
                },
                { promise: true, importScripts: MarkdownParserLibraryURL || 'https://cdn.jsdelivr.net/npm/marked/marked.min.js' }
            );
        }
        /**
         * @param {String} text 
         * @returns {Promise<String>} HTML Formatted Content
         */
        async parse( text ) {
            return ( await this.worker.postMessage( text ) ).data;
        }
        /**
         * @returns {void}
         */
        terminate() {
            this.worker.terminate();
        }
    }

    class VariableManager {
        constructor () {
            const gl = getGlobal();
            if ( !( 'VariableManager' in gl ) ) {
                gl.VariableManager = this;
                this.map = {};
    		}
    		else if ( gl.VariableManager !== this ) {
    			throw new Error( 'You are allowed to instanciate only one VariableManager per page' );
    		}
            return gl.VariableManager;
    	}
    	/**
    	 * @param {String} key - Key to look for to be replaced by object
    	 * @param {{
    	 *   exec: Function,
    	 *   parser: Object
    	 * }} object - Function and parser to call on item found thanks to key
    	 * @returns {void}
    	 */
        register( key, object ) {
            object = typeof object === 'object' ? object : {};
            const { exec, parser } = object;
    		if ( ( key in this.map ) || !( exec || parser ) ) {
    			return false;
    		}
    		this.map[key] = { exec, parser };
    	}
    	
        async execute() {
            const body = document.body;
            const nodes = [body];
            const found = [];
    		while ( nodes.length > 0 ) {
    			const currentNode = nodes.shift();
    			const { length: l } = currentNode.childNodes.length;
    			for ( let i = 0; i < l; i += 1 ) {
    				const currentChild = currentNode.childNodes[i];
    				if ( [1, 11].includes( currentChild.nodeType ) ) {
    					nodes.unshift( currentChild );
    				}
    				else if ( [3, 8].includes( currentChild.nodeType ) ) {
    					if ( ( /{{(.|\n|\r)*}}/g ).test( currentChild.textContent ) ) {
    						found.push( currentChild.parentNode );
    					}
    				}
    			}
    		}

            for ( const fo of found ) {
                let html = fo.innerHTML;
                ObjectForEach( this.map, ( key, value ) => {
                    const reg = new RegExp( `{{${key}:?(.|\n|\r)*?}}`, 'g' );
                    const res = reg.exec( html );
                    if ( res && res.length > 0 ) {
                        const fres = res.filter( e => e );
                        const { parser, exec } = value;
                        for ( const re of fres ) {
                            fo.innerHTML = '';
                            html = html.split( re );
                            for ( let i = 0; i < html.length; i++ ) {
                                const d = document.createTextNode( html[i] );
                                fo.appendChild( d );
                                if ( i < html.length - 1 ) {
                                    const e = exec( VariableManager.parse( key, parser, re ) );
                                    if ( !fo.appendChild( e ) ) {
                                        fo.insertAdjacentElement( 'afterend', e );
                                    }
                                }
                            }
                        }
                    }
                } );
            }
        }
        /**
         * @param {Object} parser 
         * @param {String} result 
         */
        static parse( key, parser, result ) {
            if ( result.length < 4 + key.length + 1 + 3 ) {
                return {};
            }
            const trimmed = result.slice( 2 + key.length + 1, result.length - 2 );
            const cut = trimmed.split( /;/g );
            const obj = cut.reduce( ( prev, curr ) => {
                const [key, value] = curr.split( /=/ );
                if ( key in parser ) {
                    if ( parser[key] === 'number' ) {
                        try {
                            prev[key] = Number( value );
                        }
                        catch ( _ ) {
                            console.error( _ );
                        }
                    }
                    else if ( parser[key] === 'symbol' ) {
                        try {
                            prev[key] = Symbol( value );
                        }
                        catch ( _ ) {
                            console.error( _ );
                        }
                    }
                    else if ( parser[key] === 'string' ) {
                        prev[key] = value.toString();
                    }
                    else if ( parser[key] === 'boolean' ) {
                        try {
                            prev[key] = Boolean( value );
                        }
                        catch ( _ ) {
                            console.error( _ );
                        }
                    }
                }
                return prev;
            }, {} );
            return obj;
        }
        static execute() {
            const gl = getGlobal();
            if ( !( 'VariableManager' in gl ) ) {
                throw new Error( 'VariableManager was not instanciated.' );
            }
            return gl.VariableManager.execute();
        }
    }

    var content = { MarkdownParser, VariableManager };

    /* eslint-env browser */

    class DatasetEncoder {
        /**
         * @param {String} key
         * @returns {DatasetEncoder}
         */
        constructor () {
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
            } else {
                this.length = this.values.push( value );
                return this.length - 1;
            }
        }
        /**
         * @param {Number} encodedIndex
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
            } else {
                const array = Array( length ).fill( 0 );
                array[index] = 1;
                return array;
            }
        }
    }

    class DatasetHeader {
        /**
         * @param {String[]} array
         * @param {{types:{[String]:String|Function}}} [options]
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
        /**
         * @returns {String[]}
         */
        get columns() {
            return [...this.indexes.keys()];
        }
        /**
         * @param {String} key
         * @returns {{key:String,index:Number,type?:Function,encoder?:DatasetEncoder}}
         */
        getColumnByKey( key ) {
            if ( this.indexes.has( key ) ) {
                return {
                    key: key,
                    index: this.indexes.get( key ),
                    ... this.types.has( key ) ? { type: this.types.get( key ) } : {},
                    ... this.encoders.has( key ) ? { encoder: this.encoders.get( key ) } : {}
                };
            }
            else {
                return undefined;
            }
        }
        /**
         * @param {Number} index
         * @returns {{key:String,index:Number,type?:Function,encoder?:DatasetEncoder}}
         */
        getColumnByIndex( index ) {
            if ( this.keys.has( index ) ) {
                const key = this.keys.get( index );
                return {
                    key: key,
                    index: index,
                    ... this.types.has( key ) ? { type: this.types.get( key ) } : {},
                    ... this.encoders.has( key ) ? { encoder: this.encoders.get( key ) } : {}
                };
            } else {
                return undefined;
            }
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
         * @param {String[]} array
         * @param {{types:{[String]:String|Function},encoders:String|String[]}} [options]
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
         * @param {{types:{[String]:String|Function},encoders:String|String[]}} [options]
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

    class Dataset {
        /**
         * @param {Array} elements 
         * @param {Boolean} [fundamental] 
         * @returns {void}
         */
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
            console.log( `<-- ${elements.length} ROWS -->\n` );
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
            return fileRowsStrings.map( row => row.replace( /\r/g, '' ).split( /,/g ).map( cell => cell.trim() ) );
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
            const [first, ...rest] = indexes;
            if ( first !== undefined ) {
                let flat = mappedData;
                if ( flat instanceof Map ) {
                    flat = [...mappedData.keys()];
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
         * @param {Array} rows
         * @param {Number[]} keys
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
         * @param {String|Function} [type]
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
         * @param {String[]} header
         * @param {{types:{[String]:String|Function}}} [options]
         * @returns {DatasetHeader}
         */
        static parseHeader( header, options ) {
            return new DatasetHeader( header, options );
        }
        /**
         * @param {String|RequestInfo} filePath
         * @param {{encoders:String[],excluded:String|String[],types:{[String]:String|Function}}} [options]
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
                        } else {
                            reject( response );
                        }
                    } )
                    .catch( reject );
            } );
        }
        /**
         * @param {String|ArrayBuffer} fileContent 
         * @param {{encoders:String[],excluded:String|String[],types:{[String]:String|Function}}} [options] 
         * @returns {Dataset}
         */
        constructor ( fileContent, options = {} ) {
            const { excluded, encoders, types, slice: { start, end } = {} } = options;
            const [header, ...rows] = Dataset.readFile( fileContent );
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
            for ( const [key, typeSetting] of types ) {
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
            const indexesToRemove = this.header.removeColumns( keys );
            return new Promise( resolve => {
                this.mapAsync( row => row.filter( ( _, index ) => !indexesToRemove.includes( index ) ) )
                    .then( () => resolve( true ) );
            } );
        }
        /**
         * @param {Array<String[]>} rows 
         * @param {{excluded:String|String[]}} [options] 
         * @returns {Array<Array>}
         */
        parseRows( rows, options = {} ) {
            const { excluded } = options;
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
         * @param {String} key
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
         * @param {String[]} keys
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
         * @param {String} key
         * @param {any} cell
         * @returns {Number}
         */
        encodeCell( key, cell ) {
            const { type, encoder } = this.header.getColumnByKey( key );
            if ( encoder ) {
                return cell = encoder.getEncoded( type( cell ) );
            }
        }
        /**
         * @param {String} key
         * @param {Array} cells
         * @returns {Array<Number>}
         */
        encodeCells( key, cells ) {
            const { type, encoder } = this.header.getColumnByKey( key );
            if ( encoder ) {
                return cells = cells.map( cell => encoder.getEncoded( type( cell ) ) );
            }
        }
        /**
         * @param {String} key
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
         * @param {String[]} keys
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
         * @param {String} key
         * @param {any} cells
         * @returns {any}
         */
        decodeCell( key, cell ) {
            const encoder = this.header.getColumnEncoderByColumnKey( key );
            if ( encoder ) {
                return cell = encoder.getDecoded( cell );
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
                return cells = cells.map( cell => encoder.getDecoded( cell ) );
            }
        }
        /**
         * @param {any} object
         * @param {String|String[]} keys 
         * @returns {{[String]:Number}}
         */
        count( object, keys ) {
            const _keys = Array.isArray( keys ) ? keys : [keys];
            const indexes = Object.create( null );
            const results = Object.create( null );
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
         * @param {any} object
         * @param {String|String[]} keys 
         * @returns {Promise<{[String]:Number}>}
         */
        async countAsync( object, keys ) {
            const _keys = Array.isArray( keys ) ? keys : [keys];
            const indexes = Object.create( null );
            const results = Object.create( null );
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
            else {
                const rows = [];
                for ( let i = 0, l = this.rows.length; i < l; i += 1 ) {
                    rows[i] = callback( this.rows[i], i, thisArg );
                }
                return rows;
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
        async mapAsync( callback, options = {} ) {
            const { inplace, thisArg = this.rows } = options;
            if ( inplace ) {
                for ( let i = 0, l = this.rows.length; i < l; i += 1 ) {
                    this.rows[i] = callback( this.rows[i], i, thisArg );
                }
                return this.rows;
            }
            else {
                const rows = [];
                for ( let i = 0, l = this.rows.length; i < l; i += 1 ) {
                    rows[i] = callback( this.rows[i], i, thisArg );
                }
                return rows;
            }
        }
    }

    var dataset = { Dataset, DatasetEncoder, DatasetHeader };

    /* eslint-env browser */

    /**
     * Check whether a class is present in an element's classlist
     * @param {HTMLElement} element - Element on which to check if the class is present
     * @param {String} className - Class to check
     * @returns {Boolean} Whether an element has checked class or not
     */
    function hasClass( element, className ) {
        if ( element && element instanceof Element && !!className && typeof className === 'string' ) {
            return element.classList.contains( className );
        }
        throw new Error( 'Element and/or ClassName arguments are not correct.' );
    }
    /**
     * Add a class to an element's classList
     * @param {HTMLElement} element - Element on which to add the class
     * @param {String} className - Class to add
     * @param {Boolean} [requireAnimationFrame] - Require an animation frame to add the class
     * @returns {DOMTokenList|Promise<DOMTokenList>} Classlist containing the added class
     */
    function addClass( element, className, requireAnimationFrame ) {
        requireAnimationFrame = requireAnimationFrame || false;
        if ( element && element instanceof Element && !!className && typeof className === 'string' ) {
            if ( requireAnimationFrame ) {
                return new Promise( function ( resolve ) {
                    window.requestAnimationFrame( function () {
                        element.classList.add( className );
                        resolve( element.classList );
                    } );
                } );
            } else {
                element.classList.add( className );
                return element.classList;
            }
        }
        throw new Error( 'Element and/or ClassName arguments are not correct.' );
    }
    /**
     * Remove a class from an element's classlist
     * @param {HTMLElement} element - Element from which to remove the class
     * @param {String} className - Class to add
     * @param {Boolean} [requireAnimationFrame] - Require an animation frame to remove the class
     * @returns {DOMTokenList|Promise<DOMTokenList>} Classlist without the removed class
     */
    function removeClass( element, className, requireAnimationFrame ) {
        requireAnimationFrame = requireAnimationFrame || false;
        if ( element && element instanceof Element && !!className && typeof className === 'string' ) {
            if ( requireAnimationFrame ) {
                return new Promise( function ( resolve ) {
                    window.requestAnimationFrame( function () {
                        element.classList.remove( className );
                        resolve( element.classList );
                    } );
                } );
            } else {
                element.classList.remove( className );
                return element.classList;
            }
        }
        throw new Error( 'Element and/or ClassName arguments are not correct.' );
    }
    /**
     * Toggle classname from element and request a frame before toggling it
     * @param {HTMLElement} element - Element on which to toggle the class
     * @param {String} className - Class to toggle
     * @param {Boolean} [requireAnimationFrame] - Require an animation frame to toggle the class
     * @returns {DOMTokenList|Promise<DOMTokenList>} Classlist containing or not the targeted class
     */
    function toggleClass( element, className, requireAnimationFrame ) {
        requireAnimationFrame = requireAnimationFrame || false;
        if ( element && element instanceof Element && !!className && typeof className === 'string' ) {
            return hasClass( element, className )
                ? removeClass( element, className, requireAnimationFrame )
                : addClass( element, className, requireAnimationFrame );
        }
        throw new Error( 'Element and/or ClassName arguments are not correct.' );
    }
    /**
     * Get or set attribute of Element or return all the attributes
     * @param {HTMLElement} element
     * @param {String} [attrName]
     * @param {Any} [value]
     * @returns {NamedNodeMap|String|void}
     */
    function attr( element, attrName, value ) {
        if ( !!attrName && typeof attrName === 'string' ) {
            if ( value !== undefined ) {
                return element.setAttribute( attrName, value );
            }
            return element.getAttribute( attrName );
        }
        return element.attributes;
    }
    /**
     * Get or set data attributes of Element or return all dataset
     * @param {HTMLElement} element
     * @param {String} [dataset]
     * @param {Any} [value]
     * @returns {DOMStringMap|String|void}
     */
    function data( element, dataset, value ) {
        if ( !!dataset && typeof dataset === 'string' ) {
            if ( value !== undefined ) {
                element.dataset[dataset] = value;
                return element.dataset[dataset];
            }
            return element.dataset[dataset];
        }
        return element.dataset;
    }
    /**
     * Element Creation Shorthand
     * @param {{
     * 	attr:{[String]:String},
     *  class:String|String[],
     *  data:{[String]:String},
     *  events:[type:String,listener:Function,options:Boolean|AddEventListenerOptions][],
     *  id:String,
     *  ns:String,
     *  style:{[String]:String}
     *  t:String,
     *  _:(Any[]|Any)
     * }[]} args
     * @returns {HTLMElement}
     */
    function ecs( ...args ) {
        const { length } = args;
        args = args.filter( item => !!item );
        if ( length === 0 ) {
            return document.createElement( 'div' );
        }
        if ( length !== 1 ) {
            const wrapper = document.createElement( 'div' );
            for ( let i = 0; i < length; i += 1 ) {
                wrapper.appendChild( ecs( args[i] ) );
            }
            return wrapper;
        }
        let current = args[0];
        if ( current instanceof Element ) {
            return current;
        }
        const {
            actions: $actions,
            attr: $attr,
            class: $class,
            data: $dataset,
            _: $childElements,
            events: $events,
            id,
            ns: $namespace,
            style: $style,
            t: $tag
        } = current;
        if ( id || $class || $tag ) {
            if ( !!$namespace && typeof $namespace === 'string' ) {
                current = document.createElementNS( $namespace, !!$tag && typeof $tag === 'string' ? $tag : 'div' );
            }
            else current = document.createElement( !!$tag && typeof $tag === 'string' ? $tag : 'div' );
            if ( id ) {
                current.id = id;
            }
            if ( $class ) {
                if ( typeof $class === 'string' ) {
                    current.classList.add( $class );
                }
                else if ( Array.isArray( $class ) ) {
                    current.classList.add( ...$class );
                }
            }
        } else {
            current = document.createElement( 'div' );
        }
        if ( $attr ) {
            ObjectForEach$1( $attr, function ( key, value ) {
                if ( value instanceof Promise ) {
                    value.then( function ( response ) {
                        attr( current, key, response );
                    } );
                }
                else {
                    attr( current, key, value );
                }
            } );
        }
        if ( $dataset ) {
            ObjectForEach$1( $dataset, function ( key, value ) {
                if ( value instanceof Promise ) {
                    value.then( function ( response ) {
                        current.dataset[key] = response;
                    } );
                }
                else {
                    current.dataset[key] = value;
                }
            } );
        }
        if ( $events ) {
            for ( const event of $events ) {
                current.addEventListener( ...event );
            }
        }
        if ( $style ) {
            ObjectForEach$1( $style, function ( key, value ) {
                if ( value instanceof Promise ) {
                    value.then( function ( response ) {
                        current.style[key] = response;
                    } );
                }
                current.style[key] = value;
            } );
        }
        if ( $childElements ) {
            for ( const item of ( ( typeof $childElements === 'object' && Symbol.iterator in $childElements ) ? $childElements : [$childElements] ) ) {
                if ( item instanceof Element ) {
                    current.appendChild( item );
                }
                else if ( typeof item === 'string' ) {
                    current.innerHTML += item;
                }
                else if ( item instanceof Promise ) {
                    const template = document.createElement( 'template' );
                    current.appendChild( template );
                    item.then( function ( response ) {
                        if ( typeof response === 'string' ) {
                            template.outerHTML += response;
                            template.remove();
                        }
                        else {
                            current.replaceChild( ecs( response ), template );
                        }
                    } ).catch( function ( _ ) {
                        console.error( 'ecs error: ', _ );
                    } );
                }
                else if ( ['number', 'bigint', 'boolean', 'symbol'].includes( typeof item ) ) {
                    current.innerHTML += `${item}`;
                }
                else {
                    current.appendChild( ecs( item ) );
                }
            }
        }
        if ( $actions ) {
            ObjectForEach$1( $actions, function ( key, values ) {
                const filteredKey = key.split( /\_\$/ );
                if ( filteredKey.length > 1 ) {
                    current[filteredKey[0]]( ...values );
                }
                else {
                    current[key]( ...values );
                }
            } );
        }
        return current;
    }
    /**
     * Execute ecs in an inline script an replace script by ecs' result
     * @param {...({attr:{[String]:String},data:{[String]:String},events:[type:String,listener:Function,options:Boolean|AddEventListenerOptions][],id:String,ns:String,style:{[String]:String}t:String,_:(Any[]|Any)})}
     */
    function ecsr() {
        const { currentScript } = document;
        const { parentElement } = currentScript;
        if ( ![document.head, document.documentElement].includes( parentElement ) ) {
            parentElement.replaceChild( ecs( ...arguments ), currentScript );
        }
    }

    var dom = {
        hasClass,
        addClass,
        removeClass,
        toggleClass,
        attr,
        data,
        ecs,
        ecsr
    };

    /* eslint-env browser */

    /**
     * @param  {...Function} funcs 
     * @returns {Function}
     */
    function pipe ( ...funcs ) {
        if ( funcs.length > 0 ) {
            return funcs.reduce( ( acc, curr ) => arg => curr( acc( arg ) ) );
        }
        throw new Error( 'No function passed.' );
    }
    /**
     * @param  {...Function} funcs 
     * @returns {Function}
     */
    function compose( ...funcs ) {
        if ( funcs.length > 0 ) {
            return funcs.reduceRight( ( acc, curr ) => arg => curr( acc( arg ) ) );
        }
        throw new Error( 'No function passed.' );
    }

    class IArray {

        static toImmutable( thisArg ) {
            if ( !( IArray.isIArray( thisArg ) ) ) {
                if (
                    Array.isArray( thisArg )
                    || Symbol.iterator in thisArg &&
                    typeof thisArg.length !== 'undefined' &&
                    typeof thisArg[0] !== 'undefined'
                ) {
                    return Object.freeze( Object.setPrototypeOf( thisArg, IArray.prototype ) );
                }
                else {
                    throw new TypeError( 'Please use IArray.from' );
                }
            }
            else {
                return Object.freeze( thisArg );
            }
        }

        static from( ...args ) {
            switch ( args.length ) {
                case 0: {
                    throw new Error( 'What\'s the point of creating an Immutable 0-sized ?' );
                }
                case 1: {
                    const Mutable = [];
                    const IterableSource = args[0];
                    if ( IterableSource && Symbol.iterator in IterableSource ) {
                        const Iterator = IterableSource[Symbol.iterator]();
                        let value;
                        let done;
                        while ( !( { value, done } = Iterator.next(), done ) ) {
                            Mutable.push( value );
                        }
                    }
                    else if ( IterableSource && typeof IterableSource === 'object' ) {
                        for ( const property in IterableSource ) {
                            if ( Object.prototype.hasOwnProperty.call( IterableSource, property ) ) {
                                Mutable.push( IterableSource[property] );
                            }
                        }
                    }
                    return IArray.toImmutable( Mutable );
                }
                default: {
                    return new IArray( ...args );
                }
            }
        }

        static isIArray( instance ) {
            return Object.getPrototypeOf( instance ) === IArray.prototype
                && 'length' in instance
                && ( !Object.isExtensible( instance ) || Object.isFrozen( instance ) );
        }

        static [Symbol.hasInstance]( instance ) {
            return IArray.isIArray( instance );
        }

        static isCollapsable( instance ) {
            return IArray.isIArray( instance ) || Array.isArray( instance );
        }

        static isResizable( instance ) {
            return Object.isExtensible( instance );
        }

        static isImmutable( instance ) {
            return Object.isFrozen( instance );
        }

        constructor ( ...args ) {
            const { length } = args;
            if ( length === 1 && typeof args[0] === 'number') {
                this.length = args[0];
            }
            else {
                this.length = length;
                Object.freeze( this );
            }
        }

        [Symbol.iterator]() {
            const { length } = this;
            let i = 0;
            return ( {
                next: () => ( {
                    value: i < length ? this[i] : undefined,
                    done: !( i++ < length )
                } )
            } );
        }

        /**
         * @returns {Number}
         */
        deepLength() {
            const { length } = this;
            let _length = length;
            for ( let i = 0; i < length; i += 1 ) {
                if ( IArray.isCollapsable( this[i] ) ) {
                    _length += IArray.prototype.deepLength.call( this[i] ) - 1;
                }
            }
            return _length;
        }

        initialize() {
            if ( IArray.isImmutable( this ) ) {
                throw new Error( 'As an immutable data structure, <fill> method can not be called on it.' );
            }
            for ( let i = 0, { length } = this; i < length; i += 1 ) {
                this[i] = null;
            }
            return Object.preventExtensions( this );

        }

        /**
         * @param {any} value 
         * @returns {IArray}
         */
        fill( value, start, end ) {
            if ( IArray.isImmutable( this ) ) {
                throw new Error( 'As an immutable data structure, <fill> method can not be called on it.' );
            }
            else {
                const { length } = this;
                const _start = typeof start !== 'undefined' && start >= 0 && start < length ? start < end ? start : end : 0;
                const _end = typeof end !== 'undefined' && end >= 0 && end < length ? end > start ? end : start : length;
                for ( let i = _start; i < _end; i += 1 ) {
                    this[i] = value;
                }
                return Object.freeze( this );
            }
        }

        /**
         * @param {Function} value 
         * @returns {IArray}
         */
        populate( callback ) {
            if ( IArray.isImmutable( this ) ) {
                throw new Error( 'As an immutable data structure, <populate> method can not be called on it.' );
            }
            else {
                for ( let i = 0, { length } = this; i < length; i += 1 ) {
                    this[i] = callback( i, this );
                }
                return Object.freeze( this );
            }
        }

        /**
         * @param {Number} i 
         * @returns {any}
         */
        at( i ) {
            return i < 0 ? this[this.length + i] : i;
        }

        /**
         * @returns {Iterable<any>}
         */
        values() {
            return ( { [Symbol.iterator]: this[Symbol.iterator] } );
        }

        /**
         * @returns {Iterable<Number,any>}
         */
        entries() {
            return ( {
                [Symbol.iterator]: () => {
                    const { length } = this;
                    let i = 0;
                    return ( {
                        next: () => ( {
                            value: i < length ? new IArray( i, this[i] ) : undefined,
                            done: !( i++ < length )
                        } )
                    } );
                }
            } );
        }

        /**
         * @returns {Iterable<Number>}
         */
        keys() {
            return ( {
                [Symbol.iterator]: () => {
                    const { length } = this;
                    let i = 0;
                    return ( {
                        next: () => ( {
                            value: i < length ? i : undefined,
                            done: !( i++ < length )
                        } )
                    } );
                }
            } );
        }

        /**
         * @param {Function} callback 
         * @param {IArray} thisArg 
         */
        forEach( callback, thisArg ) {
            thisArg = thisArg || this;
            for ( let i = 0, { length } = thisArg; i < length; i += 1 ) {
                callback( thisArg[i], i, thisArg );
            }
        }

        includes( valueToFind, fromIndex ) {
            for ( let { length } = this, i = fromIndex >= 0 && fromIndex < length ? fromIndex : 0; i < length; i += 1 ) {
                if ( Object.is( this[i], valueToFind ) ) {
                    return true;
                }
            }
            return false;
        }

        indexOf( searchElement, fromIndex ) {
            for ( let { length } = this, i = fromIndex >= 0 && fromIndex < length ? fromIndex : 0; i < length; i += 1 ) {
                if ( Object.is( this[i], searchElement ) ) {
                    return i;
                }
            }
            return -1;
        }

        lastIndexOf( searchElement, fromIndex ) {
            for ( let { length } = this, i = fromIndex >= 0 && fromIndex < length ? fromIndex : length; i > 0; i -= 1 ) {
                if ( Object.is( this[i], searchElement ) ) {
                    return i;
                }
            }
            return -1;
        }

        map( callback, thisArg ) {
            thisArg = thisArg || this;
            return new IArray( thisArg.length ).populate( index => callback( thisArg[index], index, thisArg ) );
        }

        reduce( callback, initialValue ) {
            let accumulator = initialValue || this[0];
            for ( let i = 0, { length } = this; i < length; i += 1 ) {
                accumulator = callback( accumulator, this[i], i, this );
            }
            return accumulator;
        }

        reduceRight( callback, initialValue ) {
            const { length } = this;
            let accumulator = initialValue || this[length - 1];
            for ( let i = length; i > 0; i -= 1 ) {
                accumulator = callback( accumulator, this[i], i, this );
            }
            return accumulator;
        }

        filter( callback, thisArg ) {
            thisArg = thisArg || this;
            const { length } = thisArg;
            const Mutable = [];
            for ( let i = 0; i < length; i += 1 ) {
                if ( !!callback( thisArg[i], i, thisArg ) ) {
                    Mutable.push( thisArg[i] );
                }
            }
            return IArray.toImmutable( Mutable );
        }

        every( callback, thisArg ) {
            thisArg = thisArg || this;
            for ( let i = 0, { length } = thisArg; i < length; i += 1 ) {
                if ( !callback( thisArg[i], i, thisArg ) ) {
                    return false;
                }
            }
            return true;
        }

        some( callback, thisArg ) {
            thisArg = thisArg || this;
            const { length } = thisArg;
            for ( let i = 0; i < length; i += 1 ) {
                if ( !!callback( thisArg[i], i, thisArg ) ) {
                    return true;
                }
            }
            return false;
        }

        find( callback, thisArg ) {
            thisArg = thisArg || this;
            const { length } = thisArg;
            for ( let i = 0; i < length; i += 1 ) {
                if ( !!callback( thisArg[i], i, thisArg ) ) {
                    return thisArg[i];
                }
            }
            return undefined;
        }

        findIndex( callback, thisArg ) {
            thisArg = thisArg || this;
            const { length } = thisArg;
            for ( let i = 0; i < length; i += 1 ) {
                if ( callback( thisArg[i], i, thisArg ) ) {
                    return i;
                }
            }
            return -1;
        }

        reverse() {
            const { length } = this;
            const Mutable = new IArray( length );
            for ( let i = 1; i <= length; i -= 1 ) {
                Mutable[i - 1] = this[length - i];
            }
            return Object.freeze( Mutable );
        }

        slice( start, end ) {
            const { length } = this;
            const _start = start >= 0 && start < length ? start : 0;
            const _end = end >= 0 && end <= length ? end : length;
            const _length = _end - _start;
            const Mutable = new IArray( _length );
            let _i = 0;
            for ( let i = _start; i < _end; i += 1 ) {
                Mutable[_i++] = this[i];
            }
            return Object.freeze( Mutable );
        }

        splice( start, deleteCount, ...items ) {
            const { length } = this;
            const { length: _length } = items;
            let count = typeof deleteCount === 'undefined' ? length - start : deleteCount >= 0 ? deleteCount : 0;
            const mLength = length - count + _length;
            console.log( mLength );
            const Mutable = new IArray( mLength );
            let _i = 0;
            for ( let i = 0; i < length; i += 1 ) {
                if ( i === start ) {
                    if ( _length ) {
                        for ( let j = 0; j < _length; j += 1 ) {
                            Mutable[_i++] = items[j];
                            if ( ( count -= 1 ) > 0 ) {
                                i += 1;
                            }
                        }
                    }
                }
                else if ( i > start ) {
                    while ( ( count -= 1 ) > 0 && i < length ) {
                        i += 1;
                    }
                    if ( i < length ) {
                        Mutable[_i++] = this[i];
                    }
                }
                else {
                    Mutable[_i++] = this[i];
                }
            }
            return Object.freeze( Mutable );
        }

        flatMap( callback, thisArg ) {
            thisArg = thisArg || this;
            const { length } = thisArg;
            const Mutable = [];
            for ( let i = 0; i < length; i += 1 ) {
                const item = callback( thisArg[i], i, thisArg );
                if ( IArray.isCollapsable( item ) ) {
                    for ( let j = 0, { length: _length } = item; i < _length; i += 1 ) {
                        if ( typeof item[j] !== 'undefined' ) {
                            Mutable.push( item[_j] );
                        }
                    }
                }
                else if ( typeof item !== 'undefined' ) {
                    Mutable.push( item );
                }
            }
            return IArray.toImmutable( Mutable );
        }

        flat( depth ) {
            const Mutable = [];
            for ( let i = 0, { length } = this; i < length; i += 1 ) {
                if ( depth > 1 && IArray.isCollapsable( this[i] ) ) {
                    const _item = this[i].flat( depth - 1 );
                    for ( let j = 0, { length } = _item; j < length; j += 1 ) {
                        Mutable.push( _item[j] );
                    }
                }
                else {
                    Mutable.push( this[i] );
                }
            }
            return IArray.toImmutable( Mutable );
        }

        concat( ...args ) {
            const Mutable = [];
            for ( let i = 0, { length } = this; i < length; i += 1 ) {
                Mutable.push( this[i] );
            }
            for ( let i = 0, { length } = args; i < length; i += 1 ) {
                if ( IArray.isCollapsable( args[i] ) ) {
                    for ( let ai = 0, { length } = args[i]; ai < length; ai += 1 ) {
                        Mutable.push( args[ai] );
                    }
                }
                else {
                    Mutable.push( args[i] );
                }
            }
            return IArray.toImmutable( Mutable );
        }



        copyWithin( target, start, end ) {
            const { length } = this;
            const Mutable = new IArray( length );
            if ( target > length ) {
                for ( let i = 0; i < length; i += 1 ) {
                    Mutable[i] = this[i];
                }
                return IArray.toImmutable( Mutable );
            }
            const _start = typeof start === 'undefined' ? 0 : start < 0 ? length + start : start > length ? length : start;
            const _end = typeof end === 'undefined' ? length : end < 0 ? length + end : end > length ? length : end;
            let _index = 0;
            let [toCopy, startCopy] = _start < _end ? [_end - _start, _start] : [_start - _end, _end];
            for ( let i = 0; i < length; i += 1 ) {
                if ( i >= target && toCopy-- > 0 ) {
                    Mutable[_index] = this[startCopy++];
                }
                else {
                    Mutable[_index] = this[i];
                }
                _index += 1;
            }
            return IArray.toImmutable( Mutable );
        }

        join( separator ) {
            const { length } = this;
            let string = '';
            for ( let i = 0; i < length; i += 1 ) {
                string = `${string}${separator}${this[i]}`;
            }
            return string;
        }

        sort( callback ) {
            callback = callback || ( ( a, b ) => a < b ? -1 : a > b ? 1 : 0 );
            const { length } = this;
            if ( length <= 1 ) { return IArray.from( this ); }
            const middle = Math.floor( length / 2 );
            const left = this.slice( 0, middle );
            const right = this.slice( middle );

            function merge( left, right ) {
                const { length: ll } = left;
                const { length: rl } = right;
                const Mutable = new IArray( ll + rl );
                let globalIndex = 0;
                let leftIndex = 0;
                let rightIndex = 0;
                while ( leftIndex < ll && rightIndex < rl ) {
                    if ( callback( left[leftIndex], right[rightIndex] ) < 0 ) {
                        Mutable[globalIndex++] = left[leftIndex++];
                    } else {
                        Mutable[globalIndex++] = right[rightIndex++];
                    }
                }

                for ( let i = leftIndex; i < ll; i += 1 ) {
                    Mutable[globalIndex++] = left[i];
                }
                for ( let i = rightIndex; i < rl; i += 1 ) {
                    Mutable[globalIndex++] = right[i];
                }

                return IArray.toImmutable( Mutable );
            }
            return merge( left.sort( callback ), right.sort( callback ) );

        }

        reshape( ...args ) {
            const { length } = args;
            if ( length === 0 ) {
                return this.flat( Infinity );
            }
            let array = this.flat( Infinity );
            let { length: fLength } = array;
            if ( length >= 1 && ( ( fLength % args.reduce( ( acc, curr ) => acc * curr ) !== 0 ) || ( fLength % args[0] !== 0 ) ) ) {
                throw new RangeError( `An array of shape (${fLength}, 1)  can not be converted to an array of shape (${args.join( ',' )})` );   
            }
            for ( let i = length - 1; i >= 0; i -= 1 ) {
                const dimension = args[i];
                const _length = array.length / dimension;
                array = new IArray( _length ).populate( i => new IArray( dimension ).populate( j => array[i * dimension + j] ) );
            }
            return array;
        }
        push( ...args ) {
            const { length } = this;
            const { length: _length } = args;
            if ( IArray.isImmutable( this ) ) {
                const Mutable = new IArray( sum );
                for ( let i = 0; i < length; i += 1 ) {
                    Mutable[i] = this[i];
                }
                for ( let i = 0; i < _length; i += 1 ) {
                    Mutable[i + length] = args[i];
                }
                return Object.freeze( Mutable );   
            }
            if ( IArray.isResizable( this ) ) {
                for ( let i = 0; i < _length; i += 1 ) {
                    this[length + i] = args[i];
                }
                this.length = sum;
                return this;
            }
            throw new Error( 'What the fuck are you doing ?' );
        }
        empty() {
            if ( IArray.isImmutable( this ) ) {
                throw new TypeError( 'As an immutable data structure, <empty> method can not be called on it.' );
            }
            else {
                for ( let i = 0, { length } = this; i < length; i += 1 ) {
                    this[i] = null;
                }
            }
            return this;
        }
    }
    var functional = { pipe, compose, IArray };

    /* eslint-env browser */

    class Wait {
    	constructor () { }
    	/**
    	 * @returns {{
    	 *   interactive: Function[],
    	 *   complete: Function[],
    	 *   DOMContentLoaded: Function[],
    	 *   load: Function[]
    	 * }}
    	 */
    	static register() {
    		const gl = getGlobal$1();
    		if ( typeof gl.WaitRegister === 'undefined' ) {
    			gl.WaitRegister = {
    				interactive: [],
    				complete: [],
    				DOMContentLoaded: [],
    				load: []
    			};
    			document.addEventListener( 'readystatechange', () => Wait.all( document.readyState ) );
    			document.addEventListener( 'DOMContentLoaded', () => Wait.all( 'DOMContentLoaded' ) );
    			window.addEventListener( 'load', () => Wait.all( 'load' ) );
    		}
    		return gl.WaitRegister;
    	}
    	/**
    	 * @param {string} type - Register an action to be fired when type is dispatched
    	 * @param {{
    	 *   resolve?:Function,
    	 *   reject?:Function,
    	 *   func?:Function,
    	 *   args?:any[]
    	 * }} options - Functions and args to call when action will be fired
    	 */
    	static set( type, options ) {
    		const { resolve, reject, func, args } = options;
    		const registry = Wait.register();
    		let exec = false;
    		const { readyState } = document;
    		switch ( type ) {
    			case 'interactive':
    			case 'DOMContentLoaded': {
    				if ( readyState !== 'loading' ) {
    					exec = true;
    					try {
    						resolve( func( ...args ) );
    					}
    					catch ( _ ) {
    						reject( _ );
    					}
    				}
    				break;
    			}
    			case 'complete':
    			case 'load': {
    				if ( readyState === 'complete' ) {
    					exec = true;
    					try {
    						resolve( func( ...args ) );
    					}
    					catch ( _ ) {
    						reject( _ );
    					}
    				}
    				break;
    			}
    		}
    		if ( exec === false ) {
    			registry[type].push( function () {
    				return new Promise( function ( resolve_, reject_ ) {
    					try {
    						return resolve_( resolve( func( ...args ) ) );
    					}
    					catch ( _ ) {
    						reject_( reject( _ ) );
    					}
    				} );
    			} );
    		}
    	}
    	/**
    	 * @param {"interactive" | "complete" | "DOMContentLoaded" | "load"} type - EventType or Key to wait to be dispatched or already registered
    	 * @returns {Promise<any[]>}
    	 */
    	static all( type ) {
    		return Promise.all( Wait.register()[type].map( f => f() ) );
    	}
    	/**
    	 * @param {Number} time 
    	 * @returns {Promise<Number>} Await it to do whatever you want to do
    	 */
    	static time( time ) {
    		return new Promise( resolve => setTimeout( resolve, time ) );
    	}
    	/**
    	 * 
    	 * @param {Function} func - Function to wrap in a setTimeout function
    	 * @param {Number} timeout - timeout parameter for setTimeout
    	 * @param  {...any} funcArgs - Arguments to pass to func function
    	 * @returns {Number} Timeout ID
    	 */
    	static delay( func, timeout, ...funcArgs ) {
    		return setTimeout( func, timeout || 0, ...funcArgs );
    	}
    	/**
    	 * 
    	 * @param {Function} func 
    	 * @param  {...any} funcArgs 
    	 * @returns {Promise}
    	 */
    	static async( func, ...funcArgs ) {
    		return new Promise( function ( resolve, reject ) {
    			try {
    				resolve( func( ...funcArgs ) );
    			} catch ( _ ) {
    				reject( _ );
    			}
    		} );
    	}
    	/**
    	 * 
    	 * @param {Function} func 
    	 * @param {Number} timeout 
    	 * @param  {...any} funcArgs 
    	 * @returns {Promise}
    	 */
    	static promiseDelay( func, timeout, ...funcArgs ) {
    		return new Promise( function ( resolve, reject ) {
    			return setTimeout( function ( ...args ) {
    				try {
    					return resolve( func( ...args ) );
    				}
    				catch ( _ ) {
    					return reject( _ );
    				}
    			}, timeout, ...funcArgs );
    		} );
    	}
    	/**
    	 * 
    	 * @param {Function} func 
    	 * @param  {...any} funcArgs 
    	 * @returns {Promise}
    	 */
    	static interactive( func, ...funcArgs ) {
    		return new Promise( function ( resolve, reject ) {
    			Wait.set( 'interactive', { resolve, reject, func, args: funcArgs } );
    		} );
    	}
    	/**
    	 * 
    	 * @param {Function} func 
    	 * @param  {...any} funcArgs 
    	 * @returns {Promise}
    	 */
    	static complete( func, ...funcArgs ) {
    		return new Promise( function ( resolve, reject ) {
    			Wait.set( 'complete', { resolve, reject, func, args: funcArgs } );
    		} );
    	}
    	/**
    	 * 
    	 * @param {Function} func 
    	 * @param  {...any} funcArgs 
    	 * @returns {Promise}
    	 */
    	static DOMContentLoaded( func, ...funcArgs ) {
    		return new Promise( function ( resolve, reject ) {
    			Wait.set( 'DOMContentLoaded', { resolve, reject, func, args: funcArgs } );
    		} );
    	}
    	/**
    	 * 
    	 * @param {Function} func 
    	 * @param  {...any} funcArgs 
    	 * @returns {Promise}
    	 */
    	static ready( func, ...funcArgs ) {
    		return new Promise( function ( resolve, reject ) {
    			Wait.set( 'complete', { resolve, reject, func, args: funcArgs } );
    		} );
    	}
    	/**
    	 * 
    	 * @param {Function} func 
    	 * @param  {...any} funcArgs 
    	 * @returns {Promise}
    	 */
    	static load( func, ...funcArgs ) {
    		return new Promise( function ( resolve, reject ) {
    			Wait.set( 'complete', { resolve, reject, func, args: funcArgs } );
    		} );
    	}
    }

    class ImageLoader {
    	constructor () {
    		this.worker = new ExtendedWorker(
    			function () {
    				self.onmessage = function ( event ) {
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
    		const gl = getGlobal$1();
    		if ( !( 'ImageLoader' in gl ) ) {
    			gl.ImageLoader = new ImageLoader();
    		}
    		return await gl.ImageLoader.load( options );
    	}

    	terminate() {
    		this.worker.terminate();
    	}

    	static terminate() {
    		const gl = getGlobal$1();
    		if ( 'ImageLoader' in gl ) {
    			gl.ImageLoader.terminate();
    			delete gl.ImageLoader;
    		}
    	}
    }

    var loading = { ImageLoader, Wait };

    /* eslint-env browser */

    /**
     * Set of timing functions
     */
    const Easing = {
        /**
         * @param {Number} t 
         * @param {Number} b 
         * @param {Number} c 
         * @param {Number} d 
         * @returns {Number}
         */
        linearTween: function ( t, b, c, d ) {
            return ( c * t ) / d + b;
        },
        /**
         * @param {Number} t 
         * @param {Number} b 
         * @param {Number} c 
         * @param {Number} d 
         * @returns {Number}
         */
        easeInQuad: function ( t, b, c, d ) {
            t /= d;
            return c * t * t + b;
        },
        /**
         * @param {Number} t 
         * @param {Number} b 
         * @param {Number} c 
         * @param {Number} d 
         * @returns {Number}
         */
        easeOutQuad: function ( t, b, c, d ) {
            t /= d;
            return -c * t * ( t - 2 ) + b;
        },
        /**
         * @param {Number} t 
         * @param {Number} b 
         * @param {Number} c 
         * @param {Number} d 
         * @returns {Number}
         */
        easeInOutQuad: function ( t, b, c, d ) {
            t /= d / 2;
            if ( t < 1 ) {
                return ( c / 2 ) * t * t + b;
            }
            t--;
            return ( -c / 2 ) * ( t * ( t - 2 ) - 1 ) + b;
        },
        /**
         * @param {Number} t 
         * @param {Number} b 
         * @param {Number} c 
         * @param {Number} d 
         * @returns {Number}
         */
        easeInCubic: function ( t, b, c, d ) {
            t /= d;
            return c * t * t * t + b;
        },
        /**
         * @param {Number} t 
         * @param {Number} b 
         * @param {Number} c 
         * @param {Number} d 
         * @returns {Number}
         */
        easeOutCubic: function ( t, b, c, d ) {
            t /= d;
            t--;
            return c * ( t * t * t + 1 ) + b;
        },
        /**
         * @param {Number} t 
         * @param {Number} b 
         * @param {Number} c 
         * @param {Number} d 
         * @returns {Number}
         */
        easeInOutCubic: function ( t, b, c, d ) {
            t /= d / 2;
            if ( t < 1 ) {
                return ( c / 2 ) * t * t * t + b;
            }
            t -= 2;
            return ( c / 2 ) * ( t * t * t + 2 ) + b;
        },
        /**
         * @param {Number} t 
         * @param {Number} b 
         * @param {Number} c 
         * @param {Number} d 
         * @returns {Number}
         */
        easeInQuart: function ( t, b, c, d ) {
            t /= d;
            return c * t * t * t * t + b;
        },
        /**
         * @param {Number} t 
         * @param {Number} b 
         * @param {Number} c 
         * @param {Number} d 
         * @returns {Number}
         */
        easeOutQuart: function ( t, b, c, d ) {
            t /= d;
            t--;
            return -c * ( t * t * t * t - 1 ) + b;
        },
        /**
         * @param {Number} t 
         * @param {Number} b 
         * @param {Number} c 
         * @param {Number} d 
         * @returns {Number}
         */
        easeInOutQuart: function ( t, b, c, d ) {
            t /= d / 2;
            if ( t < 1 ) {
                return ( c / 2 ) * t * t * t * t + b;
            }
            t -= 2;
            return ( -c / 2 ) * ( t * t * t * t - 2 ) + b;
        },
        /**
         * @param {Number} t 
         * @param {Number} b 
         * @param {Number} c 
         * @param {Number} d 
         * @returns {Number}
         */
        easeInQuint: function ( t, b, c, d ) {
            t /= d;
            return c * t * t * t * t * t + b;
        },
        /**
         * @param {Number} t 
         * @param {Number} b 
         * @param {Number} c 
         * @param {Number} d 
         * @returns {Number}
         */
        easeOutQuint: function ( t, b, c, d ) {
            t /= d;
            t--;
            return c * ( t * t * t * t * t + 1 ) + b;
        },
        /**
         * @param {Number} t 
         * @param {Number} b 
         * @param {Number} c 
         * @param {Number} d 
         * @returns {Number}
         */
        easeInOutQuint: function ( t, b, c, d ) {
            t /= d / 2;
            if ( t < 1 ) {
                return ( c / 2 ) * t * t * t * t * t + b;
            }
            t -= 2;
            return ( c / 2 ) * ( t * t * t * t * t + 2 ) + b;
        },
        /**
         * @param {Number} t 
         * @param {Number} b 
         * @param {Number} c 
         * @param {Number} d 
         * @returns {Number}
         */
        easeInSine: function ( t, b, c, d ) {
            return -c * Math.cos( ( t / d ) * ( Math.PI / 2 ) ) + c + b;
        },
        /**
         * @param {Number} t 
         * @param {Number} b 
         * @param {Number} c 
         * @param {Number} d 
         * @returns {Number}
         */
        easeOutSine: function ( t, b, c, d ) {
            return c * Math.sin( ( t / d ) * ( Math.PI / 2 ) ) + b;
        },
        /**
         * @param {Number} t 
         * @param {Number} b 
         * @param {Number} c 
         * @param {Number} d 
         * @returns {Number}
         */
        easeInOutSine: function ( t, b, c, d ) {
            return ( -c / 2 ) * ( Math.cos( ( Math.PI * t ) / d ) - 1 ) + b;
        },
        /**
         * @param {Number} t 
         * @param {Number} b 
         * @param {Number} c 
         * @param {Number} d 
         * @returns {Number}
         */
        easeInExpo: function ( t, b, c, d ) {
            return c * Math.pow( 2, 10 * ( t / d - 1 ) ) + b;
        },
        /**
         * @param {Number} t 
         * @param {Number} b 
         * @param {Number} c 
         * @param {Number} d 
         * @returns {Number}
         */
        easeOutExpo: function ( t, b, c, d ) {
            return c * ( -Math.pow( 2, ( -10 * t ) / d ) + 1 ) + b;
        },
        /**
         * @param {Number} t 
         * @param {Number} b 
         * @param {Number} c 
         * @param {Number} d 
         * @returns {Number}
         */
        easeInOutExpo: function ( t, b, c, d ) {
            t /= d / 2;
            if ( t < 1 ) {
                return ( c / 2 ) * Math.pow( 2, 10 * ( t - 1 ) ) + b;
            }
            t--;
            return ( c / 2 ) * ( -Math.pow( 2, -10 * t ) + 2 ) + b;
        },
        /**
         * @param {Number} t 
         * @param {Number} b 
         * @param {Number} c 
         * @param {Number} d 
         * @returns {Number}
         */
        easeInCirc: function ( t, b, c, d ) {
            t /= d;
            return -c * ( Math.sqrt( 1 - t * t ) - 1 ) + b;
        },
        /**
         * @param {Number} t 
         * @param {Number} b 
         * @param {Number} c 
         * @param {Number} d 
         * @returns {Number}
         */
        easeOutCirc: function ( t, b, c, d ) {
            t /= d;
            t--;
            return c * Math.sqrt( 1 - t * t ) + b;
        },
        /**
         * @param {Number} t 
         * @param {Number} b 
         * @param {Number} c 
         * @param {Number} d 
         * @returns {Number}
         */
        easeInOutCirc: function ( t, b, c, d ) {
            t /= d / 2;
            if ( t < 1 ) {
                return ( -c / 2 ) * ( Math.sqrt( 1 - t * t ) - 1 ) + b;
            }
            t -= 2;
            return ( c / 2 ) * ( Math.sqrt( 1 - t * t ) + 1 ) + b;
        }
    };

    /**
     * 
     * @param {Number|BigInt} dividend 
     * @param {Number|BigInt} divisor 
     * @param {Number} accuracy
     * @returns {{integer:BigInt,digits:Number[]}}
     */
    function div( dividend, divisor, accuracy = 100 ) {
            
        function add_digit( bigFloat, digit ) {
            if ( bigFloat.digits[last].length === 1000 ) {
                bigFloat.digits.push( [] );
                last += 1;
            }
            bigFloat.digits[last].push( digit );
            accuracy -= 1;
        }
            
        const BigIntDividend = BigInt( dividend );
        const BigIntDivisor = BigInt( divisor );

        if ( BigIntDivisor === 0n ) {
            return Infinity;
        }

        const BigIntQuotient = BigIntDividend / BigIntDivisor;
        const BigIntRemainder = BigIntDividend - BigIntDivisor * BigIntQuotient;

        let last = 0;

        const BigFloat = { integer: 0n, digits: [[]] };

        BigFloat.integer = BigIntQuotient;

        Object.defineProperty( BigFloat, 'toString', {
            value: function toString() {
                if ( this.digits.length > 0 ) {
                    return `${this.integer}.${this.digits.map( r => r instanceof Array ? r.join( '' ) : r ).join( '' )}`.replace( /n/g, '' );
                }
                return `${this.integer}`;
            }
        } );

        if ( BigIntRemainder === 0n ) {
            return BigFloat;
        }

        let r = BigIntRemainder * 10n;

        while ( accuracy > 0 ) {

            if ( r === 0n ) {
                break;
            }
                    
            const quotient = r / BigIntDivisor;
            const remainder = r - ( quotient * BigIntDivisor );

            add_digit( BigFloat, Number( quotient ) );

            if ( remainder > 0 ) {
                r = remainder;
            }
            else {
                add_digit( BigFloat, Number( quotient ) );
                break;
            }

            if ( r < BigIntDivisor ) {
                r = r * 10n;
            }
        }
        return BigFloat;
    }

    /**
     * @param {Number|BigInt} number 
     * @param {Number|BigInt} factor 
     * @returns {BigInt}
     */
    function mul( number, factor ) {
        return BigInt( number ) * BigInt( factor );
    }

    /**
     * @param {Number} target
     * @returns {BigInt} 
     */
    function fact( target ) {
        let n = BigInt( target );
        if ( n < 0n ) {
            throw new Error();
        }
        let r = 1n;
        for ( ; n > 0n; n -= 1n ) {
            r *= n;
        }
        return r;
    }

    /**
     * @param {Number|BigInt} number 
     * @param {Number} exp
     * @returns {BigInt} 
     */
    function pow( number, exp ) {
        return BigInt( number ) ** BigInt( exp );
    }

    /**
     * @param {Number} number 
     * @returns {BigInt} 
     */
    function fib( index ) {
        let n0 = 0n;
        let n1 = 1n;
        for ( let nx = 2; nx <= index; nx += 1 ) {
            [n0, n1] = [n1, n0 + n1];
        }
        return n0;
    }

    var math = { Easing, div, mul, pow, fact, fib };

    /* eslint-env browser */

    /**
     * Apply a smooth scroll animation when navigating through a page
     * 
     * #browser-only
     * 
     * @param {Event} event 
     * @param {String} selector 
     * @param {Number} duration 
     */
    function smoothScrollTo ( event, selector, duration = 1000 ) {
        event.preventDefault();
    	event.stopPropagation();
        const { easeInOutCubic } = Easing;
        const target = document.querySelector( selector );
        if ( !( target instanceof HTMLElement ) ) {
            return;
        }    const startPosition = window.pageYOffset;
        const targetPosition = startPosition + target.getBoundingClientRect().top;
        const distance = targetPosition - startPosition;
        let startTime = 0;
        
        /**
         * @param {Number} currentTime 
         */
        function animation( currentTime ) {
            startTime = !!startTime ? startTime : currentTime;
            const timeElapsed = currentTime - startTime;
            const run = easeInOutCubic( timeElapsed, startPosition, distance, duration );
            window.scrollTo( 0, run );
            if ( timeElapsed < duration ) {
                window.requestAnimationFrame( animation );
            }
        }

        window.requestAnimationFrame( animation );
    }

    var move = { smoothScrollTo };

    /* eslint-env browser */


    const Cookies = {
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

    class WebPTest$1 {
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
    					WebPTest$1.data.map( function ( [feature, data] ) {
    						return WebPTest$1.imageLoading( `data:image/webp;base64,${data}`, feature );
    					} )
    				).then( function ( response ) {
    					resolve( WebPTest$1.save( response ) );
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
    				wtr = await WebPTest$1.test();
    			}
    			resolve( wtr.lossy && wtr.lossless && wtr.alpha && wtr.animation );
    		} );
    	}
    }
    var navigator = {
        Cookies,
        WebPTest: WebPTest$1
    };

    /* eslint-env browser */
    /**
     * Benchmark JavaScript Code
     */
    class Benchmark {
        /**
         * @param {{logging:Boolean}} [options] - Options passed to Benchmark
         */
        constructor ( options = {} ) {
            this.perf = getGlobal$1().performance;
            this.options = {
                _logging: options.logging || false,
                _iterations: undefined,
                _last: undefined
            };
            this.match = {};
            this.metrics = new Map();
            this.pool = new Map();
            this.testPool = new Map();
            this.ticks = [];
        }
        /**
         * @returns {String}
         */
        get uid() {
            return newUID( 10 );
        }
        /**
         * @returns {String}
         */
        set last( value ) {
            return this.options._last = value;
        }
        /**
         * @returns {String}
         */
        get last() {
            return this.options._last;
        }
        /**
         * @returns {Boolean}
         */
        get logging() {
            return this.options._logging;
        }
        /**
         * @returns {Number|undefined}
         */
        get iterations() {
            return this.options._iterations;
        }
        /**
         * @param {Number} value
         * @returns {void}
         */
        set iterations( value ) {
            this.options._iterations = value;
        }
        /**
         * 
         * @param {String} label 
         * @param {Function} func 
         * @param  {...any} args 
         * @returns {Benchmark}
         */
        add( label, func, ...args ) {
            const { uid } = this;
            this.last = uid;
            this.match[uid] = label;
            this.pool.set( uid, () => {
                let end;
                let elapsed = 0;
                let i = 0;
                let test = this.testPool.get( uid );
                let start;
                if ( test ) {
                    do {
                        start = this.perf.now();
                        const result = func( ...args );
                        elapsed += this.perf.now() - start;
                        if ( !test( result ) ) {
                            console.group( `Test Failed - ${label}` );
                            console.error( 'Test Function', test );
                            console.error( 'Tested Result', result );
                            console.groupEnd( `Test Failed - ${label}` );
                            throw new Error( 'Test failed.' );
                        }
                    } while ( ( i++, elapsed < 5000 ) );
                }
                else {
                    start = this.perf.now();
                    do {
                        func( ...args );
                    } while ( ( i++, end = this.perf.now() ) < start + 5000 );
                    elapsed = end - start;
                }
                const ops = i / ( elapsed / 1000 );
                const result = { ops, elapsed, iterations: i };
                console.log( `Func ${label}\n\t> ${ops.toFixed( 3 )} op/s\n\t> ${i} op` );
                this.metrics.set( uid, result );
                return result;
            } );
            return this;
        }
        /**
         * @callback callback
         * @param {any} result
         * @returns {Boolean}
         */
        /**
         * @param {callback} func 
         */
        test( func ) {
            const { last: uid } = this;
            this.testPool.set( uid, func );
            this.last = undefined;
            return this;
        }
        /**
         * @returns {void}
         */
        start() {
            const now = this.perf.now();
            if ( this.logging ) {
                console.warn( `Started ${now} ms after page load.` );
            }
            this.ticks.push( now );
        }
        /**
         * @returns {Number}
         */
        tick() {
            const now = this.perf.now();
            const elapsed = now - this.ticks[this.ticks.length - 1];
            if ( this.logging ) {
                console.log( `Lap : ${elapsed} ms` );
            }
            this.ticks.push( now );
            return elapsed;
        }
        /**
         * @returns {Number}
         */
        stop() {
            const now = this.perf.now();
            const lastLap = now - this.ticks[this.ticks.length - 1];
            const elapsed = now - this.ticks[0];
            if ( this.logging ) {
                if ( lastLap !== elapsed ) {
                    console.log( `Lap : ${lastLap} ms` );
                }
                console.log( `Total : ${elapsed} ms` );
                console.warn( `Ended ${now} ms after page load.` );
            }
            this.ticks.push( now );
            return elapsed;
        }
        /**
         * @returns {Benchmark}
         */
        run() {
            const keys = [...( this.pool.keys() )];
            const values = [...( this.pool.values() )];
            console.group( 'Execution' );
            const results = values.map( func => func() );
            console.groupEnd();
            const sortMap = results.map( ( { ops }, index ) => [keys[index], ops] ).sort( ( [$0, a], [$1, b] ) => b - a );
            console.group( 'Results' );
            sortMap.forEach( ( [key, ops], index ) => {
                console.log( `#${index + 1} -- Func ${this.match[key]}\n\t> ${ops.toFixed( 3 )} op/s` );
            } );
            console.groupEnd();
            return this;
        }
    }

    var perf = { Benchmark };

    exports.Content = content;
    exports.DOM = dom;
    exports.Dataset = dataset;
    exports.Functional = functional;
    exports.Loading = loading;
    exports.Math = math;
    exports.Move = move;
    exports.MultiThread = multithread;
    exports.Navigator = navigator;
    exports.Performance = perf;
    exports.Utils = utils;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

}({}));
