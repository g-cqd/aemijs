import { Content, DOM, MultiThread } from '../aemi.module.js';

const { ecs } = DOM;
const { VariableManager, MarkdownParser } = Content;
const { ExtendedWorker } = MultiThread;


const ew = new ExtendedWorker(function workerFunction() {
    if ('listeners' in globalThis) {
        console.log(globalThis.listeners);
        console.log(self);
        console.log('caca prout')
    }
}, { promise: true, includeHandler: true, uglify: true });

const b = document.body;

const vm = new VariableManager();
const mp = new MarkdownParser();

vm.register( 'key', {
    exec: ({ salut }) => mp.parse(`# Bonjour ${salut}`),
    parser: { salut: "string" }
} );

b.appendChild( ecs( { _: '{{key:salut=toto}}dfgdfgdfgdf{{key:salut=Guillaume}}', attr: { caca: '{{key}}' } } ) );

vm.asyncExecute();
