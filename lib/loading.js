import { getGlobal, forEntriesIn } from './utils.js';

class Wait {
	constructor () { }
	static register() {
		const gl = getGlobal();
		if ( 'WaitRegister' in gl ) {
			return gl.WaitRegister;
		} else {
			const wr = Object.assign( Object.create( null ), {
				interactive: [],
				complete: [],
				DOMContentLoaded: [],
				load: []
			} );
			gl.WaitRegister = wr;
			document.addEventListener( 'readystatechange', function () {
				Wait.all( document.readyState );
			} );
			document.addEventListener( 'DOMContentLoaded', function () {
				Wait.all( 'DOMContentLoaded' );
			} );
			window.addEventListener( 'load', function () {
				Wait.all( 'load' );
			} );
			return gl.WaitRegister;
		}
	}
	static set( type, options ) {
		const { resolve, reject, func, args } = options;
		const wr = Wait.register();
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
			wr[type].push( function () {
				return new Promise( function ( res, rej ) {
					try {
						return res( resolve( func( ...args ) ) );
					}
					catch ( _ ) {
						rej( reject( _ ) );
					}
				} );
			} );
		}
	}
	static all( type ) {
		return Promise.all( Wait.register()[type].map( function ( e ) {
			return e();
		} ) );
	}
	static time( time ) {
		return new Promise( function ( resolve ) {
			return setTimeout( resolve, time );
		} );
	}
	static race() {
		return Promise.race( ...arguments );
	}
	static delay() {
		const [func, timeout, ...args] = arguments;
		return setTimeout( func, timeout || 0, ...args );
	}
	static async() {
		const [func, ...args] = arguments;
		return new Promise( function ( resolve, reject ) {
			try {
				return resolve( func( ...args ) );
			} catch ( _ ) {
				return reject( _ );
			}
		} );
	}
	static promiseDelay() {
		const [func, timeout, ...args] = arguments;
		return new Promise( function ( resolve, reject ) {
			return setTimeout( function ( ...args ) {
				try {
					return resolve( func( ...args ) );
				}
				catch ( _ ) {
					return reject( _ );
				}
			}, timeout, ...args );
		} );
	}
	static whileLoading() {
		const [func, ...args] = arguments;
		if ( document.readyState === 'loading' ) {
			return func( ...args );
		}
	}
	static interactive() {
		const [func, ...args] = arguments;
		return new Promise( function ( resolve, reject ) {
			Wait.set( 'interactive', Object.assign( Object.create( null ), {
				resolve, reject, func, args
			} ) );
		} );
	}
	static complete() {
		const [func, ...args] = arguments;
		return new Promise( function ( resolve, reject ) {
			Wait.set( 'complete', Object.assign( Object.create( null ), {
				resolve, reject, func, args
			} ) );
		} );
	}
	static DOMContentLoaded() {
		const [func, ...args] = arguments;
		return new Promise( function ( resolve, reject ) {
			Wait.set( 'DOMContentLoaded', Object.assign( Object.create( null ), {
				resolve, reject, func, args
			} ) );
		} );
	}
	static ready() {
		const [func, ...args] = arguments;
		return new Promise( function ( resolve, reject ) {
			Wait.set( 'complete', Object.assign( Object.create( null ), {
				resolve, reject, func, args
			} ) );
		} );
	}
	static load() {
		const [func, ...args] = arguments;
		return new Promise( function ( resolve, reject ) {
			Wait.set( 'complete', Object.assign( Object.create( null ), {
				resolve, reject, func, args
			} ) );
		} );
	}
};

export default class VariableManager {
    constructor () {
        const gl = getGlobal();
        if ( !( 'VariableManager' in gl ) ) {
            gl.VariableManager = this;
            this.map = Object.create( null );
        }
        return gl.VariableManager;
	}
	
    register( key, object ) {
        object = typeof object === 'object' ? object : {};
        const { exec, parser } = object;
        if ( (key in this.map) || !( exec || parser ) ) {
            return false;
        }
        this.map[key] = { exec, parser };
	}
	
    async execute() {
        const body = document.body;

        const nodes = [body];
        const found = [];

        while ( nodes.length > 0 ) {
            const e = nodes.shift();
            for ( const node of e.childNodes ) {
                if ( [1, 11].includes( node.nodeType ) ) {
                    nodes.unshift( node );
                }
                else if ( [3, 8].includes( node.nodeType ) ) {
                    if ( ( /{{(.|\n|\r)*}}/g ).test( node.textContent ) ) {
                        found.push( node.parentNode );
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
        }, ( {} ) );
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

export { Wait };