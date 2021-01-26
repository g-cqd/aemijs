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
        ObjectForEach( $attr, function ( key, value ) {
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
        ObjectForEach( $dataset, function ( key, value ) {
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
        ObjectForEach( $style, function ( key, value ) {
            if ( value instanceof Promise ) {
                value.then( function ( response ) {
                    current.style[key] = response;
                } );
            }
            current.style[key] = value;
        } );
    }
    if ( $childElements ) {
        for ( const item of ( !( typeof $childElements === 'string' ) && Symbol.iterator in $childElements ? $childElements : [$childElements] ) ) {
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
        ObjectForEach( $actions, function ( key, values ) {
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
