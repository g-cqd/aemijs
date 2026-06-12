import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { Dataset, LabelEncoder, parseCSV, coercers } from '../src/core/data.js';

const CSV = 'name,age,city\nAlice,30,"New York"\nBob,25,"Paris, France"\n"O""Hara",40,Dublin';
const fixture = fileURLToPath(new URL('./fixtures/people.csv', import.meta.url));

test('parseCSV handles quoted fields, embedded commas and escaped quotes', () => {
    const matrix = parseCSV(CSV);
    assert.deepEqual(matrix[2], ['Bob', '25', 'Paris, France']);
    assert.deepEqual(matrix[3], ['O"Hara', '40', 'Dublin']);
});

test('parseCSV handles CRLF and quoted newlines', () => {
    const matrix = parseCSV('a,b\r\n1,"line\nbreak"');
    assert.deepEqual(matrix, [['a', 'b'], ['1', 'line\nbreak']]);
});

test('parseCSV edge suite (ported from the v2 verification gate)', () => {
    // lone-\r row separators
    assert.deepEqual(parseCSV('a,b\rc,d'), [['a', 'b'], ['c', 'd']]);
    // trailing delimiter -> trailing empty field
    assert.deepEqual(parseCSV('a,b,\n1,2,'), [['a', 'b', ''], ['1', '2', '']]);
    // trailing newline -> no phantom empty row
    assert.deepEqual(parseCSV('a,b\n'), [['a', 'b']]);
    // empty line between rows -> single empty field row
    assert.deepEqual(parseCSV('a\n\nb'), [['a'], [''], ['b']]);
    // escaped quotes, lone and consecutive
    assert.deepEqual(parseCSV('"x""y"'), [['x"y']]);
    assert.deepEqual(parseCSV('""""'), [['"']]);
    // empty quoted field
    assert.deepEqual(parseCSV('"",a'), [['', 'a']]);
    // quoted field containing delimiter and CRLF
    assert.deepEqual(parseCSV('"a,b","c\r\nd"'), [['a,b', 'c\r\nd']]);
    // unterminated quote consumes the rest of the input
    assert.deepEqual(parseCSV('"abc\ndef'), [['abc\ndef']]);
    // empty input
    assert.deepEqual(parseCSV(''), []);
    // custom delimiter
    assert.deepEqual(parseCSV('a;b\n1;2', { delimiter: ';' }), [['a', 'b'], ['1', '2']]);
    // trim option
    assert.deepEqual(parseCSV(' a , b ', { trim: true }), [['a', 'b']]);
});

test('Dataset.parse applies typed coercers per column', () => {
    const ds = Dataset.parse(CSV, { types: { age: coercers.number } });
    assert.deepEqual(ds.columns, ['name', 'age', 'city']);
    assert.equal(ds.size, 3);
    assert.deepEqual(ds.column('age'), [30, 25, 40]);
});

test('column/select/filter are non-mutating', () => {
    const ds = Dataset.parse(CSV, { types: { age: coercers.number } });
    const adults = ds.filter((row) => row.age >= 30);
    assert.equal(adults.size, 2);
    assert.equal(ds.size, 3, 'original dataset is untouched');
    assert.deepEqual(adults.select('name').column('name'), ['Alice', 'O"Hara']);
});

test('sortBy is non-mutating with numeric, descending and locale modes', () => {
    const ds = Dataset.parse(CSV, { types: { age: coercers.number } });
    assert.deepEqual(ds.sortBy('age', { numeric: true }).column('name'), ['Bob', 'Alice', 'O"Hara']);
    assert.deepEqual(ds.sortBy('age', { numeric: true, descending: true }).column('age'), [40, 30, 25]);
    assert.deepEqual(ds.sortBy('name').column('name')[0], 'Alice');
    assert.equal(ds.column('age')[0], 30, 'source order preserved');
});

test('groupBy returns a native Map.groupBy result', () => {
    const ds = Dataset.parse('k,v\na,1\nb,2\na,3');
    const groups = ds.groupBy('k');
    assert.ok(groups instanceof Map);
    assert.equal(groups.get('a').length, 2);
});

test('count returns a Map and is safe against prototype-pollution keys', () => {
    const ds = Dataset.parse('k\n__proto__\n__proto__\nx');
    const counts = ds.count('k');
    assert.ok(counts instanceof Map);
    assert.equal(counts.get('__proto__'), 2);
    assert.equal(counts.get('x'), 1);
    assert.equal(Object.getPrototypeOf({}), Object.prototype, 'global prototype untouched');
});

test('encode swaps a column for label indices and returns the encoder', () => {
    const ds = Dataset.parse('color\nred\ngreen\nred\nblue');
    const { dataset, encoder } = ds.encode('color');
    assert.deepEqual(dataset.column('color'), [0, 1, 0, 2]);
    assert.equal(encoder.decode(2), 'blue');
});

test('toObjects yields safe null-prototype rows; iterator matches', () => {
    const ds = Dataset.parse(CSV, { types: { age: coercers.number } });
    const first = ds.toObjects()[0];
    assert.equal(Object.getPrototypeOf(first), null);
    assert.deepEqual({ ...first }, { name: 'Alice', age: 30, city: 'New York' });
    const viaIterator = [...ds].map((row) => row.name);
    assert.deepEqual(viaIterator, ['Alice', 'Bob', 'O"Hara']);
});

test('toCSV round-trips quoting', () => {
    const ds = Dataset.parse(CSV);
    const round = Dataset.parse(ds.toCSV());
    assert.deepEqual(round.rows, ds.rows);
});

test('Dataset.load fetches a data: URL through the timeout-aware loader', async () => {
    const url = `data:text/csv,${encodeURIComponent(CSV)}`;
    const ds = await Dataset.load(url, { types: { age: coercers.number } });
    assert.equal(ds.size, 3);
    assert.deepEqual(ds.column('city'), ['New York', 'Paris, France', 'Dublin']);
});

test('Dataset.load reads a local file path', async () => {
    const ds = await Dataset.load(fixture, { types: { age: coercers.number } });
    assert.equal(ds.size, 3);
    assert.deepEqual(ds.column('name'), ['Alice', 'Bob', 'O"Hara']);
});

test('LabelEncoder is O(1) bidirectional with one-hot support', () => {
    const enc = new LabelEncoder();
    const indices = enc.fitTransform(['cat', 'dog', 'cat', 'bird']);
    assert.deepEqual(indices, [0, 1, 0, 2]);
    assert.equal(enc.size, 3);
    assert.deepEqual(enc.classes, ['cat', 'dog', 'bird']);
    assert.deepEqual(enc.oneHot('dog'), [0, 1, 0]);
    assert.equal(enc.decode(2), 'bird');
    assert.throws(() => enc.encode('fish'), RangeError);
});
