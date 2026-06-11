import { test } from 'node:test';
import assert from 'node:assert/strict';

// Browser-only modules: run them against happy-dom when it can be resolved,
// otherwise skip (the native setHTML/cookieStore/scheduler branches are
// feature-detected and verified in a real browser harness).
let Window;
try {
    ({ Window } = await import('happy-dom'));
} catch {
    Window = null;
}

if (Window) {
    const window = new Window({ url: 'https://example.com/' });
    globalThis.window = window;
    globalThis.document = window.document;
    globalThis.Node = window.Node;
    globalThis.Element = window.Element;
    if (!globalThis.DOMException) {
        globalThis.DOMException = window.DOMException;
    }
}

const { ecs } = await import('../src/dom/ecs.js');
const { Cookies } = await import('../src/dom/cookies.js');
const { Wait } = await import('../src/dom/wait.js');

const opts = { skip: Window ? false : 'happy-dom not available' };

test('ecs builds an element with id, classes and text', opts, () => {
    const el = ecs({ t: 'button', id: 'go', class: ['btn', 'primary'], _: 'Click' });
    assert.equal(el.tagName, 'BUTTON');
    assert.equal(el.id, 'go');
    assert.ok(el.classList.contains('btn') && el.classList.contains('primary'));
    assert.equal(el.textContent, 'Click');
});

test('ecs applies attr, data and style', opts, () => {
    const el = ecs({ t: 'div', attr: { role: 'note' }, data: { count: '5' }, style: { color: 'red' } });
    assert.equal(el.getAttribute('role'), 'note');
    assert.equal(el.dataset.count, '5');
    assert.equal(el.style.color, 'red');
});

test('ecs wires event listeners', opts, () => {
    let clicks = 0;
    const el = ecs({ t: 'button', _: 'x', events: [['click', () => { clicks += 1; }]] });
    el.click();
    el.click();
    assert.equal(clicks, 2);
});

test('ecs nests child specs, text and numbers', opts, () => {
    const list = ecs({ t: 'ul', _: [{ t: 'li', _: 'a' }, { t: 'li', _: 2 }] });
    const items = list.querySelectorAll('li');
    assert.equal(items.length, 2);
    assert.equal(items[0].textContent, 'a');
    assert.equal(items[1].textContent, '2');
});

test('ecs returns a wrapper for multiple specs and passes Elements through', opts, () => {
    const wrapper = ecs({ t: 'span', _: '1' }, { t: 'span', _: '2' });
    assert.equal(wrapper.children.length, 2);
    const existing = document.createElement('hr');
    assert.equal(ecs(existing), existing);
});

test('ecs renders `html` as text when no sanitizer is present (XSS-safe default)', opts, () => {
    const el = ecs({ t: 'div', html: '<img src=x onerror=alert(1)>' });
    assert.equal(el.querySelector('img'), null);
    assert.equal(el.textContent, '<img src=x onerror=alert(1)>');
});

test('ecs honors unsafeHTML for trusted markup', opts, () => {
    const el = ecs({ t: 'div', unsafeHTML: '<b>bold</b>' });
    assert.ok(el.querySelector('b'));
});

test('ecs resolves Promise children into nodes', opts, async () => {
    const el = ecs({ t: 'div', _: Promise.resolve('later') });
    await Promise.resolve();
    await Promise.resolve();
    assert.equal(el.textContent, 'later');
});

test('Cookies round-trips values containing "=" (first-= split fix)', opts, async () => {
    await Cookies.set('token', 'a=b==');
    assert.equal(await Cookies.get('token'), 'a=b==');
    assert.equal(await Cookies.has('token'), true);
    const all = await Cookies.getAll();
    assert.equal(all.get('token'), 'a=b==');
});

test('Wait.interactive resolves and runs the callback', opts, async () => {
    assert.equal(await Wait.interactive(), undefined);
    assert.equal(await Wait.interactive((n) => n * 2, 21), 42);
});

test('Wait.time waits roughly the requested duration', opts, async () => {
    const start = performance.now();
    await Wait.time(15);
    assert.ok(performance.now() - start >= 12);
});

test('Wait.async captures sync return values and thrown errors', opts, async () => {
    assert.equal(await Wait.async(() => 5), 5);
    await assert.rejects(Wait.async(() => { throw new Error('boom'); }), /boom/);
});
