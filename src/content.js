/* eslint-env module */

import { ExtendedWorker } from './multithread.js';
import { getGlobal, ObjectForEach } from './utils.js';

export class MarkdownParser {

    /**
     * @param {String} MarkdownParserLibraryURL
     */
    constructor( MarkdownParserLibraryURL ) {
        this.worker = new ExtendedWorker(
            () => {
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
                    if ( ( /{{(.|\n|\r)*}}/g ).test( currentChild.textContent ) ) {
                        found.push( currentChild.parentNode );
                    }
                }
            }
        }

        for ( const fo of found ) {
            let html = fo.innerHTML;
            ObjectForEach( this.map, ( key, value ) => {
                const reg = new RegExp( `{{${ key }:?(.|\n|\r)*?}}`, 'g' );
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
            const [ key, value ] = curr.split( /[=]/ );
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
            throw new Error( 'VariableManager was not instantiated.' );
        }
        return gl.VariableManager.execute();
    }

}

export default { MarkdownParser, VariableManager };
