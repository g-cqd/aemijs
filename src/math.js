/* eslint-env node */

/**
 * Set of timing functions
 */
export const Easing = {
    /**
     * Linear
     * @param {Number} t - Current time
     * @param {Number} b - Start value
     * @param {Number} c - Change in value
     * @param {Number} d - Duration
     * @returns {Number} - Current value
     */
    linearTween( t, b, c, d ) {
        return c * t / d + b;
    },
    /**
     * Quadratic
     * @param {Number} t - Current time
     * @param {Number} b - Start value
     * @param {Number} c - Change in value
     * @param {Number} d - Duration
     * @returns {Number} - Current value
     */
    easeInQuad( t, b, c, d ) {
        t /= d;
        return c * t * t + b;
    },
    /**
     * Quadratic
     * @param {Number} t - Current time
     * @param {Number} b - Start value
     * @param {Number} c - Change in value
     * @param {Number} d - Duration
     * @returns {Number} - Current value
     */
    easeOutQuad( t, b, c, d ) {
        t /= d;
        return -c * t * ( t - 2 ) + b;
    },
    /**
     * Quadratic
     * @param {Number} t - Current time
     * @param {Number} b - Start value
     * @param {Number} c - Change in value
     * @param {Number} d - Duration
     * @returns {Number} - Current value
     */
    easeInOutQuad( t, b, c, d ) {
        t /= d / 2;
        if ( t < 1 ) {
            return c / 2 * t * t + b;
        }
        t--;
        return -c / 2 * ( t * ( t - 2 ) - 1 ) + b;
    },
    /**
     * Cubic
     * @param {Number} t - Current time
     * @param {Number} b - Start value
     * @param {Number} c - Change in value
     * @param {Number} d - Duration
     * @returns {Number} - Current value
     */
    easeInCubic( t, b, c, d ) {
        t /= d;
        return c * t * t * t + b;
    },
    /**
     * Cubic
     * @param {Number} t - Current time
     * @param {Number} b - Start value
     * @param {Number} c - Change in value
     * @param {Number} d - Duration
     * @returns {Number} - Current value
     */
    easeOutCubic( t, b, c, d ) {
        t /= d;
        t--;
        return c * ( t * t * t + 1 ) + b;
    },
    /**
     * Cubic
     * @param {Number} t - Current time
     * @param {Number} b - Start value
     * @param {Number} c - Change in value
     * @param {Number} d - Duration
     * @returns {Number} - Current value
     */
    easeInOutCubic( t, b, c, d ) {
        t /= d / 2;
        if ( t < 1 ) {
            return c / 2 * t * t * t + b;
        }
        t -= 2;
        return c / 2 * ( t * t * t + 2 ) + b;
    },
    /**
     * Quartic
     * @param {Number} t - Current time
     * @param {Number} b - Start value
     * @param {Number} c - Change in value
     * @param {Number} d - Duration
     * @returns {Number} - Current value
     */
    easeInQuart( t, b, c, d ) {
        t /= d;
        return c * t * t * t * t + b;
    },
    /**
     * Quartic
     * @param {Number} t - Current time
     * @param {Number} b - Start value
     * @param {Number} c - Change in value
     * @param {Number} d - Duration
     * @returns {Number} - Current value
     */
    easeOutQuart( t, b, c, d ) {
        t /= d;
        t--;
        return -c * ( t * t * t * t - 1 ) + b;
    },
    /**
     * Quartic
     * @param {Number} t - Current time
     * @param {Number} b - Start value
     * @param {Number} c - Change in value
     * @param {Number} d - Duration
     * @returns {Number} - Current value
     */
    easeInOutQuart( t, b, c, d ) {
        t /= d / 2;
        if ( t < 1 ) {
            return c / 2 * t * t * t * t + b;
        }
        t -= 2;
        return -c / 2 * ( t * t * t * t - 2 ) + b;
    },
    /**
     * Quintic
     * @param {Number} t - Current time
     * @param {Number} b - Start value
     * @param {Number} c - Change in value
     * @param {Number} d - Duration
     * @returns {Number} - Current value
     */
    easeInQuint( t, b, c, d ) {
        t /= d;
        return c * t * t * t * t * t + b;
    },
    /**
     * Quintic
     * @param {Number} t - Current time
     * @param {Number} b - Start value
     * @param {Number} c - Change in value
     * @param {Number} d - Duration
     * @returns {Number} - Current value
     */
    easeOutQuint( t, b, c, d ) {
        t /= d;
        t--;
        return c * ( t * t * t * t * t + 1 ) + b;
    },
    /**
     * Quintic
     * @param {Number} t - Current time
     * @param {Number} b - Start value
     * @param {Number} c - Change in value
     * @param {Number} d - Duration
     * @returns {Number} - Current value
     */
    easeInOutQuint( t, b, c, d ) {
        t /= d / 2;
        if ( t < 1 ) {
            return c / 2 * t * t * t * t * t + b;
        }
        t -= 2;
        return c / 2 * ( t * t * t * t * t + 2 ) + b;
    },
    /**
     * Sinusoidal
     * @param {Number} t - Current time
     * @param {Number} b - Start value
     * @param {Number} c - Change in value
     * @param {Number} d - Duration
     * @returns {Number} - Current value
     */
    easeInSine( t, b, c, d ) {
        return -c * Math.cos( t / d * ( Math.PI / 2 ) ) + c + b;
    },
    /**
     * Sinusoidal
     * @param {Number} t - Current time
     * @param {Number} b - Start value
     * @param {Number} c - Change in value
     * @param {Number} d - Duration
     * @returns {Number} - Current value
     */
    easeOutSine( t, b, c, d ) {
        return c * Math.sin( t / d * ( Math.PI / 2 ) ) + b;
    },
    /**
     * Sinusoidal
     * @param {Number} t - Current time
     * @param {Number} b - Start value
     * @param {Number} c - Change in value
     * @param {Number} d - Duration
     * @returns {Number} - Current value
     */
    easeInOutSine( t, b, c, d ) {
        return -c / 2 * ( Math.cos( Math.PI * t / d ) - 1 ) + b;
    },
    /**
     * Exponential
     * @param {Number} t - Current time
     * @param {Number} b - Start value
     * @param {Number} c - Change in value
     * @param {Number} d - Duration
     * @returns {Number} - Current value
     */
    easeInExpo( t, b, c, d ) {
        return c * 2 ** ( 10 * ( t / d - 1 ) ) + b;
    },
    /**
     * Exponential
     * @param {Number} t - Current time
     * @param {Number} b - Start value
     * @param {Number} c - Change in value
     * @param {Number} d - Duration
     * @returns {Number} - Current value
     */
    easeOutExpo( t, b, c, d ) {
        return c * ( -( 2 ** ( -10 * t / d ) ) + 1 ) + b;
    },
    /**
     * Exponential
     * @param {Number} t - Current time
     * @param {Number} b - Start value
     * @param {Number} c - Change in value
     * @param {Number} d - Duration
     * @returns {Number} - Current value
     */
    easeInOutExpo( t, b, c, d ) {
        t /= d / 2;
        if ( t < 1 ) {
            return c / 2 * 2 ** ( 10 * ( t - 1 ) ) + b;
        }
        t--;
        return c / 2 * ( -( 2 ** ( -10 * t ) ) + 2 ) + b;
    },
    /**
     * Circular
     * @param {Number} t - Current time
     * @param {Number} b - Start value
     * @param {Number} c - Change in value
     * @param {Number} d - Duration
     * @returns {Number} - Current value
     */
    easeInCirc( t, b, c, d ) {
        t /= d;
        return -c * ( Math.sqrt( 1 - t * t ) - 1 ) + b;
    },
    /**
     * Circular
     * @param {Number} t - Current time
     * @param {Number} b - Start value
     * @param {Number} c - Change in value
     * @param {Number} d - Duration
     * @returns {Number}
     */
    easeOutCirc( t, b, c, d ) {
        t /= d;
        t--;
        return c * Math.sqrt( 1 - t * t ) + b;
    },
    /**
     * Circular
     * @param {Number} t - Current time
     * @param {Number} b - Start value
     * @param {Number} c - Change in value
     * @param {Number} d - Duration
     * @returns {Number} - Current value
     */
    easeInOutCirc( t, b, c, d ) {
        t /= d / 2;
        if ( t < 1 ) {
            return -c / 2 * ( Math.sqrt( 1 - t * t ) - 1 ) + b;
        }
        t -= 2;
        return c / 2 * ( Math.sqrt( 1 - t * t ) + 1 ) + b;
    }
};


/**
 *
 * @param {Number|BigInt} dividend
 * @param {Number|BigInt} divisor
 * @param {Number} accuracy
 * @returns {{integer:BigInt,digits:Number[]}}
 */
function div( dividend, divisor, accuracy = 100 ) {

    function addDigit( bigFloat, digit ) {
        if ( bigFloat.digits[last].length === 1000 ) {
            bigFloat.digits.push( [] );
            last += 1;
        }
        bigFloat.digits[last].push( digit );
        accuracy -= 1;
    }

    const BigIntDividend = BigInt( dividend );
    const BigIntDivisor = BigInt( divisor );

    if ( BigIntDivisor === 0n ) {
        return Infinity;
    }

    const BigIntQuotient = BigIntDividend / BigIntDivisor;
    const BigIntRemainder = BigIntDividend - BigIntDivisor * BigIntQuotient;

    let last = 0;

    const BigFloat = { integer: 0n, digits: [ [] ] };

    BigFloat.integer = BigIntQuotient;

    Object.defineProperty( BigFloat, 'toString', {
        value: function toString() {
            if ( this.digits.length > 0 ) {
                return `${ this.integer }.${ this.digits.map( r => Array.isArray( r ) ? r.join( '' ) : r ).join( '' ) }`.replace( /n/gu, '' );
            }
            return `${ this.integer }`;
        }
    } );

    if ( BigIntRemainder === 0n ) {
        return BigFloat;
    }

    let r = BigIntRemainder * 10n;

    while ( accuracy > 0 ) {

        if ( r === 0n ) {
            break;
        }

        const quotient = r / BigIntDivisor;
        const remainder = r - quotient * BigIntDivisor;

        addDigit( BigFloat, Number( quotient ) );

        if ( remainder > 0 ) {
            r = remainder;
        }
        else {
            addDigit( BigFloat, Number( quotient ) );
            break;
        }

        if ( r < BigIntDivisor ) {
            r *= 10n;
        }
    }
    return BigFloat;
}

/**
 * @param {Number|BigInt} number
 * @param {Number|BigInt} factor
 * @returns {BigInt}
 */
function mul( number, factor ) {
    return BigInt( number ) * BigInt( factor );
}

/**
 * @param {Number} target
 * @returns {BigInt}
 */
function fact( target ) {
    let n = BigInt( target );
    if ( n < 0n ) {
        throw new Error();
    }
    let r = 1n;
    for ( ; n > 0n; n -= 1n ) {
        r *= n;
    }
    return r;
}

/**
 * @param {Number|BigInt} number
 * @param {Number} exp
 * @returns {BigInt}
 */
function pow( number, exp ) {
    return BigInt( number ) ** BigInt( exp );
}

/**
 * @param {Number} number
 * @returns {BigInt}
 */
function fib( index ) {
    let n0 = 0n;
    let n1 = 1n;
    for ( let nx = 2; nx <= index; nx += 1 ) {
        [ n0, n1 ] = [ n1, n0 + n1 ];
    }
    return n0;
}

module.exports = { Easing, div, mul, pow, fact, fib };
