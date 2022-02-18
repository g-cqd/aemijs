import { MarkdownParser, VariableManager } from '../src/content.js';
import { ecs } from '../src/dom.js';

const b = document.body;

const vm = new VariableManager();
const mp = new MarkdownParser();

vm.register( 'key', {
    exec: ( { salut } ) => mp.parse( `# Bonjour ${ salut }` ),
    parser: { salut: 'string' }
} );

b.appendChild( ecs( {
    _: '{{key:salut=toto}}Lorem Ipsum{{key:salut=Guillaume}}',
    attr: { test: '{{key}}' }
} ) );

vm.asyncExecute();
