import { IArray } from './functional.js';

const { assert } = chai;

describe( 'IArray', function () {
    describe( '#reverse()', function () {
        const original = new IArray( 1, 2, 3, 4 );
        const reversed = original.reverse();
        const target = new IArray( 4, 3, 2, 1 );
        it( 'should reverse an Immutable array that is a deep copy of original', function () {
            assert.notStrictEqual( original, reversed, new Error('#reverse does not return a new immutable array.') );
            assert.strictEqual( reversed.toString(), target.toString() );
            assert.ok( IArray.isImmutable( original ), new Error('IArray are not immutable.') );
            assert.ok( IArray.isImmutable( target ), new Error('IArray are not immutable.') );
            assert.ok( IArray.isImmutable( reversed ), new Error('IArray are not immutable.') );
        } );
    } );
} );
