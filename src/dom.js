/* eslint-env module */

import { objectForEach } from './utils.js';

/**
 * Check whether a class is present in an element's classlist
 * @param {HTMLElement} element - Element on which to check if the class is present
 * @param {String} className - Class to check
 * @returns {Boolean} Whether an element has checked class or not
 */
export function hasClass( element, className ) {
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
export function addClass( element, className, requireAnimationFrame ) {
    const _requireAnimationFrame = requireAnimationFrame || false;
    if ( element && element instanceof Element && !!className && typeof className === 'string' ) {
        if ( _requireAnimationFrame ) {
            return new Promise( resolve => {
                window.requestAnimationFrame( () => {
                    element.classList.add( className );
                    resolve( element.classList );
                } );
            } );
        }
        element.classList.add( className );
        return element.classList;

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
export function removeClass( element, className, requireAnimationFrame ) {
    const _requireAnimationFrame = requireAnimationFrame || false;
    if ( element && element instanceof Element && !!className && typeof className === 'string' ) {
        if ( _requireAnimationFrame ) {
            return new Promise( resolve => {
                window.requestAnimationFrame( () => {
                    element.classList.remove( className );
                    resolve( element.classList );
                } );
            } );
        }
        element.classList.remove( className );
        return element.classList;

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
export function toggleClass( element, className, requireAnimationFrame ) {
    const _requireAnimationFrame = requireAnimationFrame || false;
    if ( element && element instanceof Element && !!className && typeof className === 'string' ) {
        return hasClass( element, className ) ?
            removeClass( element, className, _requireAnimationFrame ) :
            addClass( element, className, _requireAnimationFrame );
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
export function attr( element, attrName, value ) {
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
export function data( element, dataset, value ) {
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
 * @typedef {[string,(this:HTMLElement,ev:any)=>void,AddEventListenerOptions]} EventListenerArguments
 * @type {Array}
 */

/**
 * @typedef {Object} ElementCreationShorthandInput
 * @property {Object} attr
 * @property {String} attr.*
 * @property {String|String[]} class
 * @property {Object} data
 * @property {String} data.*
 * @property {EventListenerArguments[]} events
 * @property {String} id
 * @property {String} ns
 * @property {Object} style
 * @property {String} style.*
 * @property {String} t
 * @property {any|any[]} _
 */

/**
 * Element Creation Shorthand
 *
 * @param {Array.<ElementCreationShorthandInput|ElementCreationShorthandInput[]|Element|Element[]>} [args]
 * @returns {HTMLElement}
 */
export function ecs( ...args ) {
    const { length } = args;
    const _args = args.filter( item => !!item );
    if ( length === 0 ) {
        return document.createElement( 'div' );
    }
    if ( length !== 1 ) {
        const wrapper = document.createElement( 'div' );
        for ( let i = 0; i < length; i += 1 ) {
            wrapper.appendChild( ecs( _args[i] ) );
        }
        return wrapper;
    }
    let current = _args[0];
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
        else {
            current = document.createElement( !!$tag && typeof $tag === 'string' ? $tag : 'div' );
        }
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
    }
    else {
        current = document.createElement( 'div' );
    }
    if ( $attr ) {
        objectForEach( $attr, ( key, value ) => {
            if ( value instanceof Promise ) {
                value.then(
                    response => {
                        attr( current, key, response );
                    },
                    error => {
                        console.error( error );
                    }
                );
            }
            else {
                attr( current, key, value );
            }
        } );
    }
    if ( $dataset ) {
        objectForEach( $dataset, ( key, value ) => {
            if ( value instanceof Promise ) {
                value.then(
                    response => {
                        current.dataset[key] = response;
                    },
                    error => {
                        console.error( error );
                    }
                );
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
        objectForEach( $style, ( key, value ) => {
            if ( value instanceof Promise ) {
                value.then(
                    response => {
                        current.style[key] = response;
                    },
                    error => {
                        console.error( error );
                    }
                );
            }
            current.style[key] = value;
        } );
    }
    if ( $childElements ) {
        for ( const item of typeof $childElements === 'object' && Symbol.iterator in $childElements ? $childElements : [ $childElements ] ) {
            if ( item instanceof Element ) {
                current.appendChild( item );
            }
            else if ( typeof item === 'string' ) {
                current.innerHTML += item;
            }
            else if ( item instanceof Promise ) {
                const template = document.createElement( 'template' );
                current.appendChild( template );
                item.then(
                    response => {
                        if ( typeof response === 'string' ) {
                            template.outerHTML += response;
                            template.remove();
                        }
                        else {
                            current.replaceChild( ecs( response ), template );
                        }
                    },
                    _ => {
                        console.error( 'ecs error: ', _ );
                    }
                );
            }
            else if ( [ 'number', 'bigint', 'boolean', 'symbol' ].includes( typeof item ) ) {
                current.innerHTML += `${ item }`;
            }
            else {
                current.appendChild( ecs( item ) );
            }
        }
    }
    if ( $actions ) {
        objectForEach( $actions, ( key, values ) => {
            const filteredKey = key.split( /_\$/u );
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
 * @param {Array.<ElementCreationShorthandInput|ElementCreationShorthandInput[]|Element|Element[]>} args
 */
export function ecsr( ...args ) {
    const { currentScript } = document;
    const { parentElement } = currentScript;
    if ( ![ document.head, document.documentElement ].includes( parentElement ) ) {
        parentElement.replaceChild( ecs( ...args ), currentScript );
    }
}

export default {
    hasClass,
    addClass,
    removeClass,
    toggleClass,
    attr,
    data,
    ecs,
    ecsr
};
