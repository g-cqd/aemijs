/**
 * aemijs/data — a small, correct CSV + label-encoder toolkit.
 *
 * The 2021 version was ~1100 lines split across two runtimes and leaned on
 * `String.split(',')` (which corrupts quoted fields) and `Array.indexOf`
 * label lookups (O(n²)). This is one cross-runtime module: an RFC-4180-ish
 * parser, a `Map`-backed encoder (O(1)), grouping via `Map.groupBy`, and a
 * `fetch`-based loader with a timeout. Non-mutating throughout.
 */

/**
 * Tokenise CSV text into a matrix of strings. Handles quoted fields, escaped
 * quotes (`""`), and embedded commas/newlines.
 * @param {string} text
 * @param {{delimiter?: string, trim?: boolean}} [options]
 * @returns {string[][]}
 */
export function parseCSV(text, { delimiter = ',', trim = false } = {}) {
    const rows = [];
    let row = [];
    let field = '';
    let quoted = false;
    let hasContent = false;
    const push = () => { row.push(trim ? field.trim() : field); field = ''; };

    for (let i = 0; i < text.length; i += 1) {
        const ch = text[i];
        if (quoted) {
            if (ch === '"') {
                if (text[i + 1] === '"') { field += '"'; i += 1; } else { quoted = false; }
            } else {
                field += ch;
            }
            continue;
        }
        if (ch === '"') { quoted = true; hasContent = true; }
        else if (ch === delimiter) { push(); hasContent = true; }
        else if (ch === '\n' || ch === '\r') {
            if (ch === '\r' && text[i + 1] === '\n') { i += 1; }
            push();
            rows.push(row);
            row = [];
            hasContent = false;
        } else { field += ch; hasContent = true; }
    }
    if (hasContent || field.length > 0) {
        push();
        rows.push(row);
    }
    return rows;
}

/** Ready-made cell coercers for `Dataset.parse({ types })`. */
export const coercers = {
    string: String,
    number: Number,
    integer: (s) => Number.parseInt(s, 10),
    boolean: (s) => /^(true|1|yes|y|t)$/iu.test(String(s).trim()),
    date: (s) => new Date(s),
    /** Safe JSON: returns the raw string instead of throwing on bad input. */
    json: (s) => { try { return JSON.parse(s); } catch { return s; } },
};

/**
 * Bidirectional label encoder backed by a `Map`, so `encode`/`decode` are O(1)
 * (the old `Array.indexOf` version was O(n) per call).
 */
export class LabelEncoder {
    #index = new Map();
    #values = [];

    /**
     * Learn the set of labels (idempotent; preserves first-seen order).
     * @param {Iterable<any>} values
     * @returns {this}
     */
    fit(values) {
        for (const value of values) {
            if (!this.#index.has(value)) {
                this.#index.set(value, this.#values.length);
                this.#values.push(value);
            }
        }
        return this;
    }

    /** @param {any} value @returns {number} */
    encode(value) {
        const i = this.#index.get(value);
        if (i === undefined) {
            throw new RangeError(`Unseen label: ${String(value)}`);
        }
        return i;
    }

    /** @param {number} index @returns {any} */
    decode(index) {
        if (index < 0 || index >= this.#values.length) {
            throw new RangeError(`Index out of range: ${index}`);
        }
        return this.#values[index];
    }

    /** @param {any} value @returns {boolean} */
    has(value) {
        return this.#index.has(value);
    }

    /** @param {any} value @returns {number[]} One-hot vector. */
    oneHot(value) {
        const vector = new Array(this.#values.length).fill(0);
        vector[this.encode(value)] = 1;
        return vector;
    }

    /** @param {Iterable<any>} values @returns {number[]} */
    transform(values) {
        return Array.from(values, (v) => this.encode(v));
    }

    /** @param {Iterable<any>} values @returns {number[]} */
    fitTransform(values) {
        const materialized = Array.from(values);
        return this.fit(materialized).transform(materialized);
    }

    /** @returns {any[]} The known classes, in index order. */
    get classes() {
        return [...this.#values];
    }

    /** @returns {number} */
    get size() {
        return this.#values.length;
    }
}

/**
 * @param {any} source
 * @param {{signal?: AbortSignal, timeout?: number}} options
 * @returns {Promise<string>}
 */
async function readSource(source, { signal, timeout = 30000 }) {
    const webProtocols = new Set(['http:', 'https:', 'data:', 'blob:']);
    let url = source instanceof URL ? source : null;
    if (!url && typeof source === 'string') {
        try {
            const parsed = new URL(source);
            if (webProtocols.has(parsed.protocol) || parsed.protocol === 'file:') {
                url = parsed;
            }
        } catch {
            // not a URL — treat as a local filesystem path below
        }
    }

    if (url && webProtocols.has(url.protocol)) {
        const deadline = AbortSignal.timeout(timeout);
        const merged = signal ? AbortSignal.any([signal, deadline]) : deadline;
        const response = await fetch(url, { signal: merged });
        if (!response.ok) {
            throw new Error(`Failed to load ${url.href}: ${response.status} ${response.statusText}`);
        }
        return response.text();
    }

    // Local filesystem (Node/Bun via node:fs, Deno via Deno.readTextFile).
    if (typeof globalThis.Deno !== 'undefined') {
        return globalThis.Deno.readTextFile(url ?? source, { signal });
    }
    const { readFile } = await import('node:fs/promises');
    return readFile(url ?? source, { encoding: 'utf8', signal });
}

/**
 * A columnar table: `columns` (names) + `rows` (arrays of cell values).
 * All transforms return a new `Dataset`; the receiver is never mutated.
 */
export class Dataset {
    /** @type {string[]} */ columns;
    /** @type {any[][]} */ rows;

    /**
     * @param {string[]} columns
     * @param {any[][]} rows
     */
    constructor(columns, rows) {
        this.columns = columns;
        this.rows = rows;
    }

    /** @returns {number} */
    get size() {
        return this.rows.length;
    }

    /**
     * Resolve a column name or numeric index to an index.
     * @param {string|number} key
     * @returns {number}
     */
    #col(key) {
        if (typeof key === 'number') {
            return key;
        }
        const i = this.columns.indexOf(key);
        if (i === -1) {
            throw new RangeError(`Unknown column: ${key}`);
        }
        return i;
    }

    /** @param {any[]} row @returns {Record<string, any>} */
    #rowObject(row) {
        const obj = Object.create(null);
        for (let i = 0; i < this.columns.length; i += 1) {
            obj[this.columns[i]] = row[i];
        }
        return obj;
    }

    /**
     * @param {string|number} key
     * @returns {any[]} A copy of the column's values.
     */
    column(key) {
        const i = this.#col(key);
        return this.rows.map((row) => row[i]);
    }

    /**
     * @param {...(string|number)} keys
     * @returns {Dataset}
     */
    select(...keys) {
        const indexes = keys.map((k) => this.#col(k));
        return new Dataset(
            indexes.map((i) => this.columns[i]),
            this.rows.map((row) => indexes.map((i) => row[i])),
        );
    }

    /**
     * @param {(row: Record<string, any>, index: number) => boolean} predicate
     * @returns {Dataset}
     */
    filter(predicate) {
        const kept = this.rows.filter((row, i) => predicate(this.#rowObject(row), i));
        return new Dataset([...this.columns], kept.map((row) => [...row]));
    }

    /**
     * Sort by a column without mutating (uses `Array.prototype.toSorted`).
     * @param {string|number} key
     * @param {{numeric?: boolean, descending?: boolean, locale?: string}} [options]
     * @returns {Dataset}
     */
    sortBy(key, { numeric = false, descending = false, locale } = {}) {
        const i = this.#col(key);
        const base = numeric
            ? (a, b) => a[i] - b[i]
            : (a, b) => String(a[i]).localeCompare(String(b[i]), locale);
        const cmp = descending ? (a, b) => base(b, a) : base;
        return new Dataset([...this.columns], this.rows.toSorted(cmp));
    }

    /**
     * Group rows by a column's value (uses native `Map.groupBy`).
     * @param {string|number} key
     * @returns {Map<any, any[][]>}
     */
    groupBy(key) {
        const i = this.#col(key);
        return Map.groupBy(this.rows, (row) => row[i]);
    }

    /**
     * Count occurrences of each value in a column. Returns a `Map`, so values
     * like `__proto__` are safe (the old plain-object version was a
     * prototype-pollution hazard).
     * @param {string|number} key
     * @returns {Map<any, number>}
     */
    count(key) {
        const i = this.#col(key);
        const counts = new Map();
        for (const row of this.rows) {
            counts.set(row[i], (counts.get(row[i]) ?? 0) + 1);
        }
        return counts;
    }

    /**
     * Label-encode a column in place of its values.
     * @param {string|number} key
     * @returns {{dataset: Dataset, encoder: LabelEncoder}}
     */
    encode(key) {
        const i = this.#col(key);
        const encoder = new LabelEncoder().fit(this.column(i));
        const rows = this.rows.map((row) => {
            const copy = [...row];
            copy[i] = encoder.encode(row[i]);
            return copy;
        });
        return { dataset: new Dataset([...this.columns], rows), encoder };
    }

    /** @returns {Record<string, any>[]} Rows as null-prototype objects. */
    toObjects() {
        return this.rows.map((row) => this.#rowObject(row));
    }

    *[Symbol.iterator]() {
        for (const row of this.rows) {
            yield this.#rowObject(row);
        }
    }

    /**
     * @param {{delimiter?: string, header?: boolean}} [options]
     * @returns {string}
     */
    toCSV({ delimiter = ',', header = true } = {}) {
        const escape = (value) => {
            const s = value === null || value === undefined ? '' : String(value);
            return s.includes('"') || s.includes('\n') || s.includes('\r') || s.includes(delimiter)
                ? `"${s.replaceAll('"', '""')}"`
                : s;
        };
        const lines = [];
        if (header) {
            lines.push(this.columns.map(escape).join(delimiter));
        }
        for (const row of this.rows) {
            lines.push(row.map(escape).join(delimiter));
        }
        return lines.join('\n');
    }

    /**
     * Parse CSV text into a `Dataset`.
     * @param {string} text
     * @param {{header?: boolean, delimiter?: string, trim?: boolean, types?: Record<string, (cell: string) => any>}} [options]
     * @returns {Dataset}
     */
    static parse(text, { header = true, delimiter = ',', trim = true, types } = {}) {
        const matrix = parseCSV(text, { delimiter, trim });
        if (matrix.length === 0) {
            return new Dataset([], []);
        }
        const columns = header ? matrix[0] : matrix[0].map((_, i) => `col${i}`);
        let rows = header ? matrix.slice(1) : matrix;
        if (types) {
            const byIndex = columns.map((name) => types[name]);
            rows = rows.map((row) => row.map((cell, i) => (byIndex[i] ? byIndex[i](cell) : cell)));
        }
        return new Dataset(columns, rows);
    }

    /** @param {string[]} columns @param {any[][]} rows @returns {Dataset} */
    static fromRows(columns, rows) {
        return new Dataset(columns, rows);
    }

    /**
     * Fetch CSV from a URL (with a timeout) or read a local file, then parse.
     * @param {string|URL} source
     * @param {{signal?: AbortSignal, timeout?: number, header?: boolean, delimiter?: string, trim?: boolean, types?: Record<string, (cell: string) => any>}} [options]
     * @returns {Promise<Dataset>}
     */
    static async load(source, options = {}) {
        const { signal, timeout, ...parseOptions } = options;
        const text = await readSource(source, { signal, timeout });
        return Dataset.parse(text, parseOptions);
    }
}

export default { Dataset, LabelEncoder, parseCSV, coercers };
