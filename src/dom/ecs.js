/**
 * aemijs/dom — ecs: a tiny declarative element builder.
 *
 * Describe a DOM subtree as a plain object and get back a real element. The
 * 2021 version concatenated `innerHTML += string` (which reparses the subtree,
 * drops listeners, and is an XSS sink). This version appends text nodes for
 * string children (safe by default) and routes the explicit `html` field
 * through the Sanitizer API (`setHTML`), with a DOMPurify hook and a
 * text-content fallback when neither is available.
 *
 * @example
 * ecs({ t: 'button', class: ['btn', 'primary'], _: 'Click me',
 *       events: [['click', () => console.log('hi')]] });
 */

let warnedNoSanitizer = false;

/** @returns {Document} */
function doc() {
    const d = globalThis.document;
    if (!d) {
        throw new Error('ecs requires a DOM (document is undefined)');
    }
    return d;
}

/**
 * Set sanitized HTML on an element: native Sanitizer API if present, then a
 * global DOMPurify if the host page provides one, else fall back to text.
 * @param {Element} element
 * @param {string} html
 */
function setSafeHTML(element, html) {
    if (typeof element.setHTML === 'function') {
        element.setHTML(html);
        return;
    }
    const purify = globalThis.DOMPurify;
    if (purify && typeof purify.sanitize === 'function') {
        element.innerHTML = purify.sanitize(html);
        return;
    }
    if (!warnedNoSanitizer) {
        warnedNoSanitizer = true;
        console.warn('ecs: no HTML sanitizer available (setHTML/DOMPurify); rendering `html` as text. Use `unsafeHTML` for trusted markup.');
    }
    element.textContent = html;
}

/**
 * @param {any} item
 * @returns {Node}
 */
function toNode(item) {
    if (item instanceof Node) {
        return item;
    }
    if (item === null || item === undefined) {
        return doc().createComment('');
    }
    const type = typeof item;
    if (type === 'object') {
        return ecs(item);
    }
    return doc().createTextNode(String(item));
}

/**
 * @param {Element} element
 * @param {Record<string, any>} attrs
 */
function applyAttributes(element, attrs) {
    for (const [key, value] of Object.entries(attrs)) {
        if (value instanceof Promise) {
            value.then((resolved) => element.setAttribute(key, resolved), (error) => console.error(error));
        } else {
            element.setAttribute(key, value);
        }
    }
}

/**
 * Build an element (or a wrapping `<div>` for multiple specs) from a spec.
 * @param {...(object|Element|string|number)} specs
 * @returns {Element}
 */
export function ecs(...specs) {
    const items = specs.filter((item) => item !== null && item !== undefined);
    if (items.length === 0) {
        return doc().createElement('div');
    }
    if (items.length > 1) {
        const wrapper = doc().createElement('div');
        wrapper.append(...items.map((item) => toNode(item)));
        return wrapper;
    }

    const spec = items[0];
    if (spec instanceof Node) {
        return spec;
    }
    if (typeof spec !== 'object') {
        const wrapper = doc().createElement('div');
        wrapper.append(String(spec));
        return wrapper;
    }

    const {
        t: tag = 'div', ns, id, class: classes, attr, data, style, events,
        html, unsafeHTML, _: children, actions,
    } = spec;

    const element = ns ? doc().createElementNS(ns, tag) : doc().createElement(tag);

    if (id) {
        element.id = id;
    }
    if (classes) {
        element.classList.add(...(Array.isArray(classes) ? classes : [classes]));
    }
    if (attr) {
        applyAttributes(element, attr);
    }
    if (data) {
        for (const [key, value] of Object.entries(data)) {
            if (value instanceof Promise) {
                value.then((resolved) => { element.dataset[key] = resolved; }, (error) => console.error(error));
            } else {
                element.dataset[key] = value;
            }
        }
    }
    if (style) {
        for (const [key, value] of Object.entries(style)) {
            if (value instanceof Promise) {
                value.then((resolved) => { element.style[key] = resolved; }, (error) => console.error(error));
            } else {
                element.style[key] = value;
            }
        }
    }
    if (events) {
        for (const args of events) {
            element.addEventListener(...args);
        }
    }
    if (typeof unsafeHTML === 'string') {
        element.innerHTML = unsafeHTML;
    } else if (typeof html === 'string') {
        setSafeHTML(element, html);
    }
    if (children !== null && children !== undefined) {
        const list = typeof children === 'object' && Symbol.iterator in children ? children : [children];
        for (const child of list) {
            if (child instanceof Promise) {
                const placeholder = doc().createComment('ecs');
                element.append(placeholder);
                child.then(
                    (resolved) => placeholder.replaceWith(toNode(resolved)),
                    (error) => console.error('ecs child error:', error),
                );
            } else {
                element.append(toNode(child));
            }
        }
    }
    if (actions) {
        for (const [key, args] of Object.entries(actions)) {
            const method = key.split('_$')[0];
            element[method](...args);
        }
    }
    return element;
}

/**
 * Run `ecs` from an inline script and replace that script tag with the result.
 * No-ops safely when there is no current script (e.g. module/deferred scripts).
 * @param {...(object|Element|string|number)} specs
 */
export function ecsr(...specs) {
    const script = doc().currentScript;
    if (!script || !script.parentElement) {
        throw new Error('ecsr: no currentScript to replace (not available in module/async scripts)');
    }
    script.parentElement.replaceChild(ecs(...specs), script);
}

export default { ecs, ecsr };
