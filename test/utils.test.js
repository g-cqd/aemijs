import Utils from '../src/utils.js';

const { assert } = chai;

describe( 'Utils', () => {

    describe( '#getGlobal()', () => {
        it( 'should be strictly equal to window', () => {
            assert.strictEqual( Utils.getGlobal(), window );
        } );
    } );

    describe( '#isBrowser()', () => {
        it( 'should be true', () => {
            assert.isOk( Utils.isBrowser() );
        } );
    } );

    describe( '#isNode()', () => {
        it( 'should be false', () => {
            assert.isNotOk( Utils.isNode() );
        } );
    } );

    describe( '#isWorker()', () => {
        it( 'should be false', () => {
            assert.isNotOk( Utils.isWorker() );
        } );
    } );

    describe( '#newUID( 0 )', () => {
        const variable = Utils.newUID( 0 );
        it( 'should be an empty string', () => {
            assert.strictEqual( variable.length, 0 );
        } );
    } );
    describe( '#newUID( 16 )', () => {
        const variable = Utils.newUID( 16 );
        it( 'should be a 16-sized string', () => {
            assert.strictEqual( variable.length, 16 );
        } );

        const bigNumbersLaw = Array( 1000 ).fill( null );

        for ( let i = 0, { length } = bigNumbersLaw; i < length; i += 1 ) {
            bigNumbersLaw[i] = Utils.newUID( 16 );
        }

        it( 'should be randomized', () => {
            assert.isOk( ( function testRandomization() {
                for ( let i = 0, { length } = bigNumbersLaw; i < length; i += 1 ) {
                    for ( let j = i + 1; j < length; j += 1 ) {
                        if ( bigNumbersLaw[i] === bigNumbersLaw[j] ) {
                            return false;
                        }
                    }
                }
                return true;
            } )() );
        } );
    } );

    describe( '#objectForEach( { foo:\'bar\', toto:\'titi\' } )', () => {

        const test = { foo: 'bar', toto: 'titi' };
        const targetKeys = [ 'foo', 'toto' ];
        const targetValues = [ 'bar', 'titi' ];
        const testedKeys = [];
        const testedValues = [];
        let indexSum = 0;
        Utils.objectForEach( test, ( key, values, index ) => {
            testedKeys.push( key );
            testedValues.push( values );
            indexSum += index;
        } );


        it( 'should iter over every keys', () => {
            assert.deepEqual( targetKeys, testedKeys );
            assert.strictEqual( 1, indexSum );
        } );

        it( 'should access every values', () => {
            assert.deepEqual( targetValues, testedValues );
            assert.strictEqual( 1, indexSum );
        } );
    } );

    describe( '#objectMap( { foo:\'bar\', toto:\'titi\' }, (key,value) =>  \'\' + key + value )', () => {

        const test = { foo: 'bar', toto: 'titi' };
        const targetResult = { foo: 'foobar', toto: 'tototiti' };
        const targetKeys = [ 'foo', 'toto' ];
        const targetValues = [ 'foobar', 'tototiti' ];
        const testedKeys = [];
        const testedValues = [];
        let indexSum = 0;
        const target = Utils.objectMap( test, ( key, value, index ) => {
            const targetValue = `${ key }${ value }`;
            testedKeys.push( key );
            testedValues.push( targetValue );
            indexSum += index;
            return targetValue;
        } );


        it( 'should iter over every keys', () => {
            assert.deepEqual( targetKeys, testedKeys );
            assert.strictEqual( 1, indexSum );
        } );

        it( 'should access every values', () => {
            assert.deepEqual( targetValues, testedValues );
            assert.strictEqual( 1, indexSum );
        } );

        it( 'should be a new object', () => {
            assert.notStrictEqual( test, target );
        } );

        it( 'should have been modified as wanted', () => {
            assert.deepStrictEqual( target, targetResult );
        } );

    } );
} );
