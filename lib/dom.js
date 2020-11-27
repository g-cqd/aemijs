import { forEntriesIn } from './utils.js';

/**
 * Return true if classname is present, false otherwise.
 * @param {HTMLElement} element
 * @param {String} className
 * @returns {Boolean}
 */
const hasClass = function ( element, className ) {
	if ( element && element instanceof Element && !!className && typeof className === 'string' ) {
		return element.classList.contains( className );
	}
	throw new Error( 'Element and/or ClassName arguments are not correct.' );
};


/**
 * Add className to element's classList
 * @param {HTMLElement} element
 * @param {String} className
 * @param {Boolean} [requireAnimationFrame]
 * @returns {DOMTokenList|Promise<DOMTokenList>}
 */
const addClass = function ( element, className, requireAnimationFrame ) {
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
};


/**
 * Remove className from element's classList
 * @param {HTMLElement} element
 * @param {String} className
 * @param {Boolean} [requireAnimationFrame]
 * @returns {DOMTokenList|Promise<DOMTokenList>} 
 */
const removeClass = function ( element, className, requireAnimationFrame ) {
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
};


/**
 * Toggle classname from element and request a frame before toggling it
 * @param {HTMLElement} element
 * @param {String} className
 * @param {Boolean} [requireAnimationFrame]
 * @returns {DOMTokenList|Promise<DOMTokenList>}
 */
const toggleClass = function ( element, className, requireAnimationFrame ) {
	requireAnimationFrame = requireAnimationFrame || false;
	if ( element && element instanceof Element && !!className && typeof className === 'string' ) {
		return hasClass( element, className )
			? removeClass( element, className, requireAnimationFrame )
			: addClass( element, className, requireAnimationFrame );
	}
	throw new Error( 'Element and/or ClassName arguments are not correct.' );
};


/**
 * Get or set attribute of Element or return all the attributes
 * @param {HTMLElement} element
 * @param {String} [attrName]
 * @param {Any} [value]
 * @returns {NamedNodeMap|String|void}
 */
const attr = function ( element, attrName, value ) {
	if ( !!attrName && typeof attrName === 'string' ) {
		if ( value !== undefined ) {
			return element.setAttribute( attrName, value );
		}
		return element.getAttribute( attrName );
	}
	return element.attributes;
};


/**
 * Get or set data attributes of Element or return all dataset
 * @param {HTMLElement} element
 * @param {String} [dataset]
 * @param {Any} [value]
 * @returns {DOMStringMap|String|void}
 */
const data = function ( element, dataset, value ) {
	if ( !!dataset && typeof dataset === 'string' ) {
		if ( value !== undefined ) {
			element.dataset[dataset] = value;
			return element.dataset[dataset];
		}
		return element.dataset[dataset];
	}
	return element.dataset;
};


/**
 * Element Creation Shorthand
 * @param {...({attr:{String:String},data:{String:String},events:[type:String,listener:Function,options:Boolean|AddEventListenerOptions][],id:String,ns:String,style:{String:String}t:String,_:(Any[]|Any)})}
 * @returns {HTLMElement}
 */
const ecs = function () {
	const l = [];
	let ll = arguments.length;
	if ( ll === 0 ) {
		return document.createElement( 'div' );
	}
	for ( let x = 0, n = ll; x < n; x += 1 ) {
		const y = arguments[x];
		if ( !!y ) {
			l[x] = y;
		}
		else {
			ll -= 1;
		}
	}
	if ( ll === 0 ) {
		return document.createElement( 'div' );
	}
	else if ( ll !== 1 ) {
		const a = document.createElement( 'div' );
		for ( const b of l ) {
			a.appendChild( ecs( b ) );
		}
		return a;
	}
	let e = l.pop();
	if ( e instanceof Element ) {
		return e;
	}
	const {
		actions: a,
		attr: t,
		class: c,
		data: d,
		_: h,
		events: v,
		id,
		ns: n,
		style: s,
		t: g
	} = e;
	if ( id || c || g ) {
		if ( !!n && typeof n === 'string' ) {
			e = document.createElementNS( n, !!g && typeof g === 'string' ? g : 'div' );
		}
		else e = document.createElement( !!g && typeof g === 'string' ? g : 'div' );
		if ( id ) {
			e.id = id;
		}
		if ( c ) {
			if ( typeof c === 'string' ) {
				e.classList.add( c );
			}
			else {
				e.classList.add( ...c );
			}
		}
	} else {
		e = document.createElement( 'div' );
	}
	if ( t ) {
		forEntriesIn( t, function ( k, v ) {
			if ( v instanceof Promise ) {
				v.then( function ( r ) {
					attr( e, k, r );
				} );
			}
			else {
				attr( e, k, v );
			}
		} );
	}
	if ( d ) {
		forEntriesIn( d, function ( k, v ) {
			if ( v instanceof Promise ) {
				v.then( function ( r ) {
					e.dataset[k] = r;
				} );
			}
			else {
				e.dataset[k] = v;
			}
		} );
	}
	if ( v ) {
		for ( const ev of v ) {
			e.addEventListener( ...ev );
		}
	}
	if ( s ) {
		forEntriesIn( s, function ( k, v ) {
			e.style[k] = v;
		} );
	}
	if ( h ) {
		for ( const i of ( !( typeof h === 'string' ) && Symbol.iterator in h ? h : [h] ) ) {
			if ( i instanceof Element ) {
				e.appendChild( i );
			}
			else if ( typeof i === 'string' ) {
				e.innerHTML += i;
			}
			else if ( i instanceof Promise ) {
				const a = document.createElement( 'template' );
				e.appendChild( a );
				i.then( function ( r ) {
					if ( typeof r === 'string' ) {
						a.outerHTML += r;
						a.remove();
					}
					else {
						e.replaceChild( ecs( r ), a );
					}
				} ).catch( function ( _ ) {
					console.error( 'ecs error: ', _ );
				} );
			}
			else if ( ['number', 'bigint', 'boolean', 'symbol'].includes( typeof i ) ) {
				e.innerHTML += `${i}`;
			}
			else {
				e.appendChild( ecs( i ) );
			}
		}
	}
	if ( a ) {
		forEntriesIn( a, function ( k, v ) {
			const a = k.split( /\_\$/ );
			if ( a.length > 1 ) {
				e[a[0]]( ...v );
			}
			else {
				e[k]( ...v );
			}
		} );
	}
	return e;
};


/**
 * Execute ecs in an inline script an replace script by ecs' result
 * @param {...({attr:{String:String},data:{String:String},events:[type:String,listener:Function,options:Boolean|AddEventListenerOptions][],id:String,ns:String,style:{String:String}t:String,_:(Any[]|Any)})}
 */
const ecsr = function () {
	const { currentScript } = document;
	const { parentElement } = currentScript;
	if ( ![document.head, document.documentElement].includes( parentElement ) ) {
		parentElement.replaceChild( ecs( ...arguments ), currentScript );
	}
};

export {
	hasClass,
	addClass,
	removeClass,
	toggleClass,
	attr,
	data,
	ecs,
	ecsr
};