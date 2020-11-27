import { ExtendedWorker } from './navigator.js';

class MarkdownParser {
    constructor ( MarkdownParserLibraryURL ) {
        MarkdownParserLibraryURL = MarkdownParserLibraryURL || 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
        this.worker = new ExtendedWorker(
            `function () { importScripts( '${MarkdownParserLibraryURL}' ); self.onmessage = function (event) { self.postMessage( { id: event.data.id, data: { data: marked( event.data.data ) } } ); }; }`,
            { promise: true }
        );
    }

    async parse( text ) {
        return ( await this.worker.postMessage( text ) ).data;
    }

    terminate() {
        this.worker.terminate();
    }

}

export { MarkdownParser };