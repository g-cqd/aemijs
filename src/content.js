import { ExtendedWorker } from './navigator.js';

class MarkdownParser {
    /**
     * @param {String} MarkdownParserLibraryURL 
     */
    constructor ( MarkdownParserLibraryURL ) {
        this.worker = new ExtendedWorker(
            function ( self ) { self.onmessage = function ( e ) { self.postMessage( { id: e.data.id, data: { data: marked( e.data.data ) } } ); }; },
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

export { MarkdownParser };
