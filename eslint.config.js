import js from '@eslint/js';

// A handful of platform globals we touch across runtimes. Declared inline to
// avoid pulling in the `globals` package — aemijs ships zero dependencies.
const platform = [
    'globalThis', 'console', 'queueMicrotask', 'structuredClone',
    'crypto', 'performance', 'fetch', 'URL', 'URLSearchParams',
    'AbortController', 'AbortSignal', 'Blob', 'TextEncoder', 'TextDecoder',
    'Worker', 'MessageChannel', 'MessagePort', 'self', 'navigator',
    'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
    'process', 'document', 'window', 'scheduler', 'cookieStore', 'Temporal',
    'Response', 'Request', 'Headers', 'Image', 'DOMException', 'Node',
    'Element', 'Blob', 'Event',
].reduce((acc, name) => { acc[name] = 'readonly'; return acc; }, {});

export default [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: platform,
        },
        rules: {
            'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            'no-console': 'off',
            'prefer-const': 'error',
            'no-var': 'error',
            eqeqeq: ['error', 'smart'],
        },
    },
];
