import Utils from './utils.js';

const { assert } = chai;

describe( 'Utils', function () {

    describe( '#getGlobal()', function () {
        it( 'should be strictly equal to window', function () {
            assert.strictEqual( Utils.getGlobal(), window );
        } );
    } );

    describe( '#isBrowser()', function () {
        it( 'should be true', function () {
            assert.isOk( Utils.isBrowser() );
        } );
    } );

    describe( '#isNode()', function () {
        it( 'should be false', function () {
            assert.isNotOk( Utils.isNode() );
        } );
    } );

    describe( '#isWorker()', function () {
        it( 'should be false', function () {
            assert.isNotOk( Utils.isWorker() );
        } );
    } );

    describe( '#newUID( 0 )', function () {
        const variable = Utils.newUID( 0 );
        it( 'should be an empty string', function () {
            assert.strictEqual( variable.length, 0 );
        } );
    } );
    describe( '#newUID( 16 )', function () {
        const variable = Utils.newUID( 16 );
        it( 'should be a 16-sized string', function () {
            assert.strictEqual( variable.length, 16 );
        } );

        const bigNumbersLaw = Array( 1000 ).fill( null );
        
        for ( let i = 0, { length } = bigNumbersLaw; i < length; i += 1 ) {
            bigNumbersLaw[i] = Utils.newUID( 16 );
        }
            
        it( 'should be randomized', function () {
            assert.isOk( ( function () {
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

    describe( '#ObjectForEach( { foo:\'bar\', toto:\'titi\' } )', function () {

        const test = { foo: 'bar', toto: 'titi' };
        const targetKeys = ['foo', 'toto'];
        const targetValues = ['bar', 'titi'];
        const testedKeys = [];
        const testedValues = [];
        let indexSum = 0;
        Utils.ObjectForEach( test, (key,values,index) => {
            testedKeys.push( key );
            testedValues.push( values );
            indexSum += index;
        } );
        
        
        it( 'should iter over every keys', function () {
            assert.deepEqual( targetKeys, testedKeys );
            assert.strictEqual( 1, indexSum )
        } );

        it( 'should access every values', function () {
            assert.deepEqual( targetValues, testedValues );
            assert.strictEqual( 1, indexSum )
        } );
    });

    describe( '#ObjectForEach( { foo:\'bar\', toto:\'titi\' } )', function () {

        const test = { foo: 'bar', toto: 'titi' };
        const targetResult = { foo: '0bar', toto: '1titi' };
        const targetKeys = ['foo', 'toto'];
        const targetValues = ['bar', 'titi'];
        const testedKeys = [];
        const testedValues = [];
        let indexSum = 0;
        const target = Utils.ObjectMap( test, (key,value,index) => {
            testedKeys.push( key );
            testedValues.push( value );
            indexSum += index;
            return `${index}${value}`
        } );
        
        
        it( 'should iter over every keys', function () {
            assert.deepEqual( targetKeys, testedKeys );
            assert.strictEqual( 1, indexSum )
        } );

        it( 'should access every values', function () {
            assert.deepEqual( targetValues, testedValues );
            assert.strictEqual( 1, indexSum )
        } );

        it( 'should be a new object', function () {
            assert.notStrictEqual( test, target );
        } );

        it( 'should have been modified as wanted', function () {
            assert.deepStrictEqual( target, targetResult );
        } );

    });
} );
