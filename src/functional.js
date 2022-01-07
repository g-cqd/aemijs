/* eslint-env module */

/**
 * @param  {...Function} funcs
 * @returns {Function}
 */
export function pipe( ...funcs ) {
    if ( funcs.length > 0 ) {
        return funcs.reduce( ( acc, curr ) => arg => curr( acc( arg ) ) );
    }
    throw new Error( 'No function passed.' );
}

/**
 * @param  {...Function} funcs
 * @returns {Function}
 */
export function compose( ...funcs ) {
    if ( funcs.length > 0 ) {
        return funcs.reduceRight( ( acc, curr ) => arg => curr( acc( arg ) ) );
    }
    throw new Error( 'No function passed.' );
}

export class IArray {

    static toImmutable( thisArg ) {
        if ( !IArray.isIArray( thisArg ) ) {
            if (
                Array.isArray( thisArg ) ||
                Symbol.iterator in thisArg &&
                typeof thisArg.length !== 'undefined' &&
                typeof thisArg[0] !== 'undefined'
            ) {
                return Object.freeze( Object.setPrototypeOf( thisArg, IArray.prototype ) );
            }

            throw new TypeError( 'Please use IArray.from' );

        }
        else {
            return Object.freeze( thisArg );
        }
    }

    static from( ...args ) {
        switch ( args.length ) {
            case 0: {
                throw new Error( 'What\'s the point of creating an Immutable 0-sized ?' );
            }
            case 1: {
                const Mutable = [];
                const IterableSource = args[0];
                if ( IterableSource && Symbol.iterator in IterableSource ) {
                    const Iterator = IterableSource[Symbol.iterator]();
                    let value;
                    let done;
                    while ( !( { value, done } = Iterator.next(), done ) ) {
                        Mutable.push( value );
                    }
                }
                else if ( IterableSource && typeof IterableSource === 'object' ) {
                    for ( const property in IterableSource ) {
                        if ( Object.prototype.hasOwnProperty.call( IterableSource, property ) ) {
                            Mutable.push( IterableSource[property] );
                        }
                    }
                }
                return IArray.toImmutable( Mutable );
            }
            default: {
                return new IArray( ...args );
            }
        }
    }

    static isIArray( instance ) {
        return Object.getPrototypeOf( instance ) === IArray.prototype &&
            'length' in instance &&
            ( !Object.isExtensible( instance ) || Object.isFrozen( instance ) );
    }

    static [Symbol.hasInstance]( instance ) {
        return IArray.isIArray( instance );
    }

    static isCollapsable( instance ) {
        return IArray.isIArray( instance ) || Array.isArray( instance );
    }

    static isResizable( instance ) {
        return Object.isExtensible( instance );
    }

    static isImmutable( instance ) {
        return Object.isFrozen( instance );
    }

    constructor( ...args ) {
        const { length } = args;
        if ( length === 1 && typeof args[0] === 'number' ) {
            this.length = args[0];
        }
        else {
            this.length = length;
            for ( let i = 0; i < length; i += 1 ) {
                this[i] = args[i];
            }
            Object.freeze( this );
        }
    }

    [Symbol.iterator]() {
        const { length } = this;
        let i = 0;
        return {
            next: () => ( {
                value: i < length ? this[i] : undefined,
                done: i++ >= length
            } )
        };
    }

    toString() {
        const { length } = this;
        if ( length === 0 ) {
            return '';
        }

        let outputString = `${ this[0] }`;
        for ( let i = 1; i < length; i += 1 ) {
            outputString += `,${ this[i] }`;
        }
        return outputString;

    }

    /**
     * @returns {Number}
     */
    deepLength() {
        const { length } = this;
        let _length = length;
        for ( let i = 0; i < length; i += 1 ) {
            if ( IArray.isCollapsable( this[i] ) ) {
                _length += IArray.prototype.deepLength.call( this[i] ) - 1;
            }
        }
        return _length;
    }

    initialize() {
        if ( IArray.isImmutable( this ) ) {
            throw new Error( 'As an immutable data structure, <initialize> method can not be called on it.' );
        }
        for ( let i = 0, { length } = this; i < length; i += 1 ) {
            this[i] = null;
        }
        return Object.preventExtensions( this );

    }

    /**
     * @param {any} value
     * @returns {IArray}
     */
    fill( value, start, end ) {
        if ( IArray.isImmutable( this ) ) {
            throw new Error( 'As an immutable data structure, <fill> method can not be called on it.' );
        }
        else {
            const { length } = this;
            const _start = typeof start !== 'undefined' && start >= 0 && start < length ? start < end ? start : end : 0;
            const _end = typeof end !== 'undefined' && end >= 0 && end < length ? end > start ? end : start : length;
            for ( let i = _start; i < _end; i += 1 ) {
                this[i] = value;
            }
            return Object.freeze( this );
        }
    }

    /**
     * @param {Function} value
     * @returns {IArray}
     */
    populate( callback ) {
        if ( IArray.isImmutable( this ) ) {
            throw new Error( 'As an immutable data structure, <populate> method can not be called on it.' );
        }
        else {
            for ( let i = 0, { length } = this; i < length; i += 1 ) {
                this[i] = callback( i, this );
            }
            return Object.freeze( this );
        }
    }

    /**
     * @param {Number} i
     * @returns {any}
     */
    at( i ) {
        return i < 0 ? this[this.length + i] : i;
    }

    /**
     * @returns {Iterable<any>}
     */
    values() {
        return { [Symbol.iterator]: this[Symbol.iterator] };
    }

    /**
     * @returns {Iterable<Number,any>}
     */
    entries() {
        return {
            [Symbol.iterator]: () => {
                const { length } = this;
                let i = 0;
                return {
                    next: () => ( {
                        value: i < length ? new IArray( i, this[i] ) : undefined,
                        done: !( i++ < length )
                    } )
                };
            }
        };
    }

    /**
     * @returns {Iterable<Number>}
     */
    keys() {
        return {
            [Symbol.iterator]: () => {
                const { length } = this;
                let i = 0;
                return {
                    next: () => ( {
                        value: i < length ? i : undefined,
                        done: !( i++ < length )
                    } )
                };
            }
        };
    }

    /**
     * @param {Function} callback
     * @param {IArray} thisArg
     */
    forEach( callback, thisArg ) {
        thisArg = thisArg || this;
        for ( let i = 0, { length } = thisArg; i < length; i += 1 ) {
            callback( thisArg[i], i, thisArg );
        }
    }

    includes( valueToFind, fromIndex ) {
        for ( let { length } = this, i = fromIndex >= 0 && fromIndex < length ? fromIndex : 0; i < length; i += 1 ) {
            if ( Object.is( this[i], valueToFind ) ) {
                return true;
            }
        }
        return false;
    }

    indexOf( searchElement, fromIndex ) {
        for ( let { length } = this, i = fromIndex >= 0 && fromIndex < length ? fromIndex : 0; i < length; i += 1 ) {
            if ( Object.is( this[i], searchElement ) ) {
                return i;
            }
        }
        return -1;
    }

    /**
     * @param {any} searchElement
     * @param {Number} fromIndex
     * @returns {Number}
     */
    lastIndexOf(searchElement, fromIndex) {
        for ( let { length } = this, i = fromIndex >= 0 && fromIndex < length ? fromIndex : length; i > 0; i -= 1 ) {
            if ( Object.is( this[i], searchElement ) ) {
                return i;
            }
        }
        return -1;
    }

    map( callback, thisArg ) {
        thisArg = thisArg || this;
        return new IArray( thisArg.length ).populate( index => callback( thisArg[index], index, thisArg ) );
    }

    reduce( callback, initialValue ) {
        let accumulator = initialValue || this[0];
        for ( let i = 0, { length } = this; i < length; i += 1 ) {
            accumulator = callback( accumulator, this[i], i, this );
        }
        return accumulator;
    }

    reduceRight( callback, initialValue ) {
        const { length } = this;
        let accumulator = initialValue || this[length - 1];
        for ( let i = length; i > 0; i -= 1 ) {
            accumulator = callback( accumulator, this[i], i, this );
        }
        return accumulator;
    }

    filter( callback, thisArg ) {
        thisArg = thisArg || this;
        const { length } = thisArg;
        const Mutable = [];
        for ( let i = 0; i < length; i += 1 ) {
            if ( callback( thisArg[i], i, thisArg ) ) {
                Mutable.push( thisArg[i] );
            }
        }
        return IArray.toImmutable( Mutable );
    }

    every( callback, thisArg ) {
        thisArg = thisArg || this;
        for ( let i = 0, { length } = thisArg; i < length; i += 1 ) {
            if ( !callback( thisArg[i], i, thisArg ) ) {
                return false;
            }
        }
        return true;
    }

    some( callback, thisArg ) {
        thisArg = thisArg || this;
        const { length } = thisArg;
        for ( let i = 0; i < length; i += 1 ) {
            if ( callback( thisArg[i], i, thisArg ) ) {
                return true;
            }
        }
        return false;
    }

    find( callback, thisArg ) {
        thisArg = thisArg || this;
        const { length } = thisArg;
        for ( let i = 0; i < length; i += 1 ) {
            if ( callback( thisArg[i], i, thisArg ) ) {
                return thisArg[i];
            }
        }
        return undefined;
    }

    findIndex( callback, thisArg ) {
        thisArg = thisArg || this;
        const { length } = thisArg;
        for ( let i = 0; i < length; i += 1 ) {
            if ( callback( thisArg[i], i, thisArg ) ) {
                return i;
            }
        }
        return -1;
    }

    reverse() {
        const { length } = this;
        const Mutable = new IArray( length );
        for ( let i = 1; i <= length; i += 1 ) {
            Mutable[i - 1] = this[length - i];
        }
        return Object.freeze( Mutable );
    }

    slice( start, end ) {
        const { length } = this;
        const _start = start >= 0 && start < length ? start : 0;
        const _end = end >= 0 && end <= length ? end : length;
        const _length = _end - _start;
        const Mutable = new IArray( _length );
        let _i = 0;
        for ( let i = _start; i < _end; i += 1 ) {
            Mutable[_i++] = this[i];
        }
        return Object.freeze( Mutable );
    }

    splice( start, deleteCount, ...items ) {
        const { length } = this;
        const { length: _length } = items;
        let count = typeof deleteCount === 'undefined' ? length - start : deleteCount >= 0 ? deleteCount : 0;
        const mLength = length - count + _length;
        console.log( mLength );
        const Mutable = new IArray( mLength );
        let _i = 0;
        for ( let i = 0; i < length; i += 1 ) {
            if ( i === start ) {
                if ( _length ) {
                    for ( let j = 0; j < _length; j += 1 ) {
                        Mutable[_i++] = items[j];
                        if ( ( count -= 1 ) > 0 ) {
                            i += 1;
                        }
                    }
                }
            }
            else if ( i > start ) {
                while ( ( count -= 1 ) > 0 && i < length ) {
                    i += 1;
                }
                if ( i < length ) {
                    Mutable[_i++] = this[i];
                }
            }
            else {
                Mutable[_i++] = this[i];
            }
        }
        return Object.freeze( Mutable );
    }

    flatMap( callback, thisArg ) {
        thisArg = thisArg || this;
        const { length } = thisArg;
        const Mutable = [];
        for ( let i = 0; i < length; i += 1 ) {
            const item = callback( thisArg[i], i, thisArg );
            if ( IArray.isCollapsable( item ) ) {
                for ( let j = 0, { length: _length } = item; i < _length; i += 1 ) {
                    if ( typeof item[j] !== 'undefined' ) {
                        Mutable.push( item[_j] );
                    }
                }
            }
            else if ( typeof item !== 'undefined' ) {
                Mutable.push( item );
            }
        }
        return IArray.toImmutable( Mutable );
    }

    flat( depth ) {
        const Mutable = [];
        for ( let i = 0, { length } = this; i < length; i += 1 ) {
            if ( depth > 1 && IArray.isCollapsable( this[i] ) ) {
                const _item = this[i].flat( depth - 1 );
                for ( let j = 0, { length } = _item; j < length; j += 1 ) {
                    Mutable.push( _item[j] );
                }
            }
            else {
                Mutable.push( this[i] );
            }
        }
        return IArray.toImmutable( Mutable );
    }

    concat( ...args ) {
        const Mutable = [];
        for ( let i = 0, { length } = this; i < length; i += 1 ) {
            Mutable.push( this[i] );
        }
        for ( let i = 0, { length } = args; i < length; i += 1 ) {
            if ( IArray.isCollapsable( args[i] ) ) {
                for ( let ai = 0, { length } = args[i]; ai < length; ai += 1 ) {
                    Mutable.push( args[ai] );
                }
            }
            else {
                Mutable.push( args[i] );
            }
        }
        return IArray.toImmutable( Mutable );
    }



    copyWithin( target, start, end ) {
        const { length } = this;
        const Mutable = new IArray( length );
        if ( target > length ) {
            for ( let i = 0; i < length; i += 1 ) {
                Mutable[i] = this[i];
            }
            return IArray.toImmutable( Mutable );
        }
        const _start = typeof start === 'undefined' ? 0 : start < 0 ? length + start : start > length ? length : start;
        const _end = typeof end === 'undefined' ? length : end < 0 ? length + end : end > length ? length : end;
        let _index = 0;
        let [ toCopy, startCopy ] = _start < _end ? [ _end - _start, _start ] : [ _start - _end, _end ];
        for ( let i = 0; i < length; i += 1 ) {
            if ( i >= target && toCopy-- > 0 ) {
                Mutable[_index] = this[startCopy++];
            }
            else {
                Mutable[_index] = this[i];
            }
            _index += 1;
        }
        return IArray.toImmutable( Mutable );
    }

    join( separator ) {
        const { length } = this;
        let string = '';
        for ( let i = 0; i < length; i += 1 ) {
            string = `${ string }${ separator }${ this[i] }`;
        }
        return string;
    }

    sort( callback ) {
        callback = callback || ( ( a, b ) => a < b ? -1 : a > b ? 1 : 0 );
        const { length } = this;
        if ( length <= 1 ) {
            return IArray.from( this );
        }
        const middle = Math.floor( length / 2 );
        const left = this.slice( 0, middle );
        const right = this.slice( middle );

        function merge( left, right ) {
            const { length: ll } = left;
            const { length: rl } = right;
            const Mutable = new IArray( ll + rl );
            let globalIndex = 0;
            let leftIndex = 0;
            let rightIndex = 0;
            while ( leftIndex < ll && rightIndex < rl ) {
                if ( callback( left[leftIndex], right[rightIndex] ) < 0 ) {
                    Mutable[globalIndex++] = left[leftIndex++];
                }
                else {
                    Mutable[globalIndex++] = right[rightIndex++];
                }
            }

            for ( let i = leftIndex; i < ll; i += 1 ) {
                Mutable[globalIndex++] = left[i];
            }
            for ( let i = rightIndex; i < rl; i += 1 ) {
                Mutable[globalIndex++] = right[i];
            }

            return IArray.toImmutable( Mutable );
        }
        return merge( left.sort( callback ), right.sort( callback ) );

    }

    reshape( ...args ) {
        const { length } = args;
        if ( length === 0 ) {
            return this.flat( Infinity );
        }
        let array = this.flat( Infinity );
        const { length: fLength } = array;
        if ( length >= 1 && ( fLength % args.reduce( ( acc, curr ) => acc * curr ) !== 0 || fLength % args[0] !== 0 ) ) {
            throw new RangeError( `An array of shape (${ fLength }, 1)  can not be converted to an array of shape (${ args.join( ',' ) })` );
        }
        for ( let i = length - 1; i >= 0; i -= 1 ) {
            const dimension = args[i];
            const _length = array.length / dimension;
            array = new IArray( _length ).populate( i => new IArray( dimension ).populate( j => array[i * dimension + j] ) );
        }
        return array;
    }

    push( ...args ) {
        const { length } = this;
        const { length: _length } = args;
        const _sum = length + _length;
        if ( IArray.isImmutable( this ) ) {
            const Mutable = new IArray( sum );
            for ( let i = 0; i < length; i += 1 ) {
                Mutable[i] = this[i];
            }
            for ( let i = 0; i < _length; i += 1 ) {
                Mutable[i + length] = args[i];
            }
            return Object.freeze( Mutable );
        }
        if ( IArray.isResizable( this ) ) {
            for ( let i = 0; i < _length; i += 1 ) {
                this[length + i] = args[i];
            }
            this.length = sum;
            return this;
        }
        throw new Error( 'What the fuck are you doing ?' );
    }

    empty() {
        if ( IArray.isImmutable( this ) ) {
            throw new TypeError( 'As an immutable data structure, <empty> method can not be called on it.' );
        }
        else {
            for ( let i = 0, { length } = this; i < length; i += 1 ) {
                this[i] = null;
            }
        }
        return this;
    }

}

export default { pipe, compose, IArray };
