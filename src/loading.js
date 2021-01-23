import { forEntriesIn, getGlobal } from './utils.js';

/**
 * 
 */
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
		const gl = getGlobal();
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
};

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
            forEntriesIn( this.map, ( key, value ) => {
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
};

export { VariableManager, Wait };
