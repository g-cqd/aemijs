/**
 * aemijs/dom — Cookies: a small async cookie helper.
 *
 * Prefers the modern async `cookieStore` API and falls back to `document.cookie`.
 * Fixes two 2021 bugs: reads split on the *first* `=` only (so base64/`=`-bearing
 * values survive), and `delete` includes the `path` (so path-scoped cookies are
 * actually removed). Expiry uses `toUTCString()` (not the deprecated
 * `toGMTString()`).
 */

const store = globalThis.cookieStore;

/** @returns {Map<string, string>} */
function parseDocumentCookies() {
    const map = new Map();
    const raw = globalThis.document?.cookie;
    if (!raw) {
        return map;
    }
    for (const part of raw.split(';')) {
        const trimmed = part.trim();
        if (!trimmed) {
            continue;
        }
        const eq = trimmed.indexOf('=');
        const name = eq === -1 ? trimmed : trimmed.slice(0, eq);
        const value = eq === -1 ? '' : trimmed.slice(eq + 1);
        map.set(decodeURIComponent(name), decodeURIComponent(value));
    }
    return map;
}

/** @param {Date|number} expires @returns {Date} */
function toDate(expires) {
    return expires instanceof Date ? expires : new Date(expires);
}

/** @param {string} value @returns {string} */
function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

/**
 * @typedef {object} CookieOptions
 * @property {Date|number} [expires] - Expiry as a Date or epoch milliseconds.
 * @property {number} [maxAge] - Max-age in seconds (document.cookie fallback).
 * @property {string} [path]
 * @property {string} [domain]
 * @property {'strict'|'lax'|'none'} [sameSite]
 * @property {boolean} [secure]
 */

export const Cookies = {
    /**
     * @param {string} name
     * @returns {Promise<string|undefined>}
     */
    async get(name) {
        if (store) {
            const cookie = await store.get(name);
            return cookie ? cookie.value : undefined;
        }
        return parseDocumentCookies().get(name);
    },

    /**
     * @param {string} name
     * @returns {Promise<boolean>}
     */
    async has(name) {
        if (store) {
            return (await store.get(name)) !== null;
        }
        return parseDocumentCookies().has(name);
    },

    /**
     * @returns {Promise<Map<string, string>>}
     */
    async getAll() {
        if (store) {
            const all = await store.getAll();
            return new Map(all.map((cookie) => [cookie.name, cookie.value]));
        }
        return parseDocumentCookies();
    },

    /**
     * @param {string} name
     * @param {string|number|boolean} value
     * @param {CookieOptions} [options]
     * @returns {Promise<void>}
     */
    async set(name, value, options = {}) {
        const { expires, maxAge, path = '/', domain, sameSite = 'strict', secure = true } = options;
        if (store) {
            await store.set({
                name,
                value: String(value),
                path,
                sameSite,
                ...(domain ? { domain } : {}),
                ...(expires ? { expires: toDate(expires).getTime() } : {}),
            });
            return;
        }
        const parts = [
            `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
            `Path=${path}`,
            `SameSite=${capitalize(sameSite)}`,
        ];
        if (expires) {
            parts.push(`Expires=${toDate(expires).toUTCString()}`);
        }
        if (maxAge !== undefined) {
            parts.push(`Max-Age=${maxAge}`);
        }
        if (domain) {
            parts.push(`Domain=${domain}`);
        }
        if (secure) {
            parts.push('Secure');
        }
        globalThis.document.cookie = parts.join('; ');
    },

    /**
     * @param {string} name
     * @param {{path?: string, domain?: string}} [options]
     * @returns {Promise<void>}
     */
    async delete(name, { path = '/', domain } = {}) {
        if (store) {
            await store.delete({ name, path, ...(domain ? { domain } : {}) });
            return;
        }
        const parts = [
            `${encodeURIComponent(name)}=`,
            `Path=${path}`,
            'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
        ];
        if (domain) {
            parts.push(`Domain=${domain}`);
        }
        globalThis.document.cookie = parts.join('; ');
    },
};

export default { Cookies };
