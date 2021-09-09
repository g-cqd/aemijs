/* eslint-env module */

import { getGlobal, objectForEach } from './utils.js';
import { ExtendedWorker } from './multithread.js';

export class MarkdownParser {

    /**
     * @param {String} MarkdownParserLibraryURL
     */
    constructor( MarkdownParserLibraryURL ) {
        this.worker = new ExtendedWorker(
            () => {
                globalThis.onmessage = function onmessage( event ) {
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

export class VariableManager {

    constructor() {
        const gl = getGlobal();
        if ( !( 'VariableManager' in gl ) ) {
            gl.VariableManager = this;
            this.map = {};
        }
        else if ( gl.VariableManager !== this ) {
            throw new Error( 'You are allowed to instantiate only one VariableManager per page' );
        }
    }

    /**
     * @typedef {Object} VariableHandler
     * @property {Function} exec
     * @property {Object} parser
     *
     */

    /**
     * @param {String} key - Key to look for to be replaced by object
     * @param {VariableHandler} object - Function and parser to call on item found thanks to key
     * @returns {void}
     */
    register( key, object ) {
        object = typeof object === 'object' ? object : {};
        const { exec, parser } = object;
        if ( key in this.map || !( exec || parser ) ) {
            return;
        }
        this.map[key] = { exec, parser };
    }

    async execute() {
        const { body } = document;
        const nodes = [ body ];
        const found = [];
        while ( nodes.length > 0 ) {
            const currentNode = nodes.shift();
            const { length: l } = currentNode.childNodes.length;
            for ( let i = 0; i < l; i += 1 ) {
                const currentChild = currentNode.childNodes[i];
                if ( [ 1, 11 ].includes( currentChild.nodeType ) ) {
                    nodes.unshift( currentChild );
                }
                else if ( [ 3, 8 ].includes( currentChild.nodeType ) ) {
                    if ( ( /\{\{(?:.|\n|\r)*\}\}/gu ).test( currentChild.textContent ) ) {
                        found.push( currentChild.parentNode );
                    }
                }
            }
        }

        for ( const fo of found ) {
            let html = fo.innerHTML;
            objectForEach( this.map, ( key, value ) => {
                const reg = new RegExp( `{{${ key }:?(?:.|\n|\r)*?}}`, 'gu' );
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
     * @param {String} key
     * @param {Object} parser
     * @param {String} result
     */
    static parse( key, parser, result ) {
        if ( result.length < 4 + key.length + 1 + 3 ) {
            return {};
        }
        const trimmed = result.slice( 2 + key.length + 1, result.length - 2 );
        const cut = trimmed.split( /;/gu );
        return cut.reduce( ( prev, curr ) => {
            const [ prop, value ] = curr.split( /[=]/u );
            if ( prop in parser ) {
                if ( parser[prop] === 'number' ) {
                    try {
                        prev[prop] = Number( value );
                    }
                    catch ( _ ) {
                        console.error( _ );
                    }
                }
                else if ( parser[prop] === 'symbol' ) {
                    try {
                        prev[prop] = Symbol( value );
                    }
                    catch ( _ ) {
                        console.error( _ );
                    }
                }
                else if ( parser[prop] === 'string' ) {
                    prev[prop] = value.toString();
                }
                else if ( parser[prop] === 'boolean' ) {
                    try {
                        prev[prop] = Boolean( value );
                    }
                    catch ( _ ) {
                        console.error( _ );
                    }
                }
            }
            return prev;
        }, {} );
    }

    static execute() {
        const gl = getGlobal();
        if ( !( 'VariableManager' in gl ) ) {
            throw new Error( 'VariableManager was not instantiated.' );
        }
        return gl.VariableManager.execute();
    }

}

export default { MarkdownParser, VariableManager };
