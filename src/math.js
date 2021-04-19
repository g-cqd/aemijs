/* eslint-env module */

/**
 * Set of timing functions
 */
export const Easing = {
    /**
     * @param {Number} t 
     * @param {Number} b 
     * @param {Number} c 
     * @param {Number} d 
     * @returns {Number}
     */
    linearTween: function ( t, b, c, d ) {
        return ( c * t ) / d + b;
    },
    /**
     * @param {Number} t 
     * @param {Number} b 
     * @param {Number} c 
     * @param {Number} d 
     * @returns {Number}
     */
    easeInQuad: function ( t, b, c, d ) {
        t /= d;
        return c * t * t + b;
    },
    /**
     * @param {Number} t 
     * @param {Number} b 
     * @param {Number} c 
     * @param {Number} d 
     * @returns {Number}
     */
    easeOutQuad: function ( t, b, c, d ) {
        t /= d;
        return -c * t * ( t - 2 ) + b;
    },
    /**
     * @param {Number} t 
     * @param {Number} b 
     * @param {Number} c 
     * @param {Number} d 
     * @returns {Number}
     */
    easeInOutQuad: function ( t, b, c, d ) {
        t /= d / 2;
        if ( t < 1 ) {
            return ( c / 2 ) * t * t + b;
        }
        t--;
        return ( -c / 2 ) * ( t * ( t - 2 ) - 1 ) + b;
    },
    /**
     * @param {Number} t 
     * @param {Number} b 
     * @param {Number} c 
     * @param {Number} d 
     * @returns {Number}
     */
    easeInCubic: function ( t, b, c, d ) {
        t /= d;
        return c * t * t * t + b;
    },
    /**
     * @param {Number} t 
     * @param {Number} b 
     * @param {Number} c 
     * @param {Number} d 
     * @returns {Number}
     */
    easeOutCubic: function ( t, b, c, d ) {
        t /= d;
        t--;
        return c * ( t * t * t + 1 ) + b;
    },
    /**
     * @param {Number} t 
     * @param {Number} b 
     * @param {Number} c 
     * @param {Number} d 
     * @returns {Number}
     */
    easeInOutCubic: function ( t, b, c, d ) {
        t /= d / 2;
        if ( t < 1 ) {
            return ( c / 2 ) * t * t * t + b;
        }
        t -= 2;
        return ( c / 2 ) * ( t * t * t + 2 ) + b;
    },
    /**
     * @param {Number} t 
     * @param {Number} b 
     * @param {Number} c 
     * @param {Number} d 
     * @returns {Number}
     */
    easeInQuart: function ( t, b, c, d ) {
        t /= d;
        return c * t * t * t * t + b;
    },
    /**
     * @param {Number} t 
     * @param {Number} b 
     * @param {Number} c 
     * @param {Number} d 
     * @returns {Number}
     */
    easeOutQuart: function ( t, b, c, d ) {
        t /= d;
        t--;
        return -c * ( t * t * t * t - 1 ) + b;
    },
    /**
     * @param {Number} t 
     * @param {Number} b 
     * @param {Number} c 
     * @param {Number} d 
     * @returns {Number}
     */
    easeInOutQuart: function ( t, b, c, d ) {
        t /= d / 2;
        if ( t < 1 ) {
            return ( c / 2 ) * t * t * t * t + b;
        }
        t -= 2;
        return ( -c / 2 ) * ( t * t * t * t - 2 ) + b;
    },
    /**
     * @param {Number} t 
     * @param {Number} b 
     * @param {Number} c 
     * @param {Number} d 
     * @returns {Number}
     */
    easeInQuint: function ( t, b, c, d ) {
        t /= d;
        return c * t * t * t * t * t + b;
    },
    /**
     * @param {Number} t 
     * @param {Number} b 
     * @param {Number} c 
     * @param {Number} d 
     * @returns {Number}
     */
    easeOutQuint: function ( t, b, c, d ) {
        t /= d;
        t--;
        return c * ( t * t * t * t * t + 1 ) + b;
    },
    /**
     * @param {Number} t 
     * @param {Number} b 
     * @param {Number} c 
     * @param {Number} d 
     * @returns {Number}
     */
    easeInOutQuint: function ( t, b, c, d ) {
        t /= d / 2;
        if ( t < 1 ) {
            return ( c / 2 ) * t * t * t * t * t + b;
        }
        t -= 2;
        return ( c / 2 ) * ( t * t * t * t * t + 2 ) + b;
    },
    /**
     * @param {Number} t 
     * @param {Number} b 
     * @param {Number} c 
     * @param {Number} d 
     * @returns {Number}
     */
    easeInSine: function ( t, b, c, d ) {
        return -c * Math.cos( ( t / d ) * ( Math.PI / 2 ) ) + c + b;
    },
    /**
     * @param {Number} t 
     * @param {Number} b 
     * @param {Number} c 
     * @param {Number} d 
     * @returns {Number}
     */
    easeOutSine: function ( t, b, c, d ) {
        return c * Math.sin( ( t / d ) * ( Math.PI / 2 ) ) + b;
    },
    /**
     * @param {Number} t 
     * @param {Number} b 
     * @param {Number} c 
     * @param {Number} d 
     * @returns {Number}
     */
    easeInOutSine: function ( t, b, c, d ) {
        return ( -c / 2 ) * ( Math.cos( ( Math.PI * t ) / d ) - 1 ) + b;
    },
    /**
     * @param {Number} t 
     * @param {Number} b 
     * @param {Number} c 
     * @param {Number} d 
     * @returns {Number}
     */
    easeInExpo: function ( t, b, c, d ) {
        return c * Math.pow( 2, 10 * ( t / d - 1 ) ) + b;
    },
    /**
     * @param {Number} t 
     * @param {Number} b 
     * @param {Number} c 
     * @param {Number} d 
     * @returns {Number}
     */
    easeOutExpo: function ( t, b, c, d ) {
        return c * ( -Math.pow( 2, ( -10 * t ) / d ) + 1 ) + b;
    },
    /**
     * @param {Number} t 
     * @param {Number} b 
     * @param {Number} c 
     * @param {Number} d 
     * @returns {Number}
     */
    easeInOutExpo: function ( t, b, c, d ) {
        t /= d / 2;
        if ( t < 1 ) {
            return ( c / 2 ) * Math.pow( 2, 10 * ( t - 1 ) ) + b;
        }
        t--;
        return ( c / 2 ) * ( -Math.pow( 2, -10 * t ) + 2 ) + b;
    },
    /**
     * @param {Number} t 
     * @param {Number} b 
     * @param {Number} c 
     * @param {Number} d 
     * @returns {Number}
     */
    easeInCirc: function ( t, b, c, d ) {
        t /= d;
        return -c * ( Math.sqrt( 1 - t * t ) - 1 ) + b;
    },
    /**
     * @param {Number} t 
     * @param {Number} b 
     * @param {Number} c 
     * @param {Number} d 
     * @returns {Number}
     */
    easeOutCirc: function ( t, b, c, d ) {
        t /= d;
        t--;
        return c * Math.sqrt( 1 - t * t ) + b;
    },
    /**
     * @param {Number} t 
     * @param {Number} b 
     * @param {Number} c 
     * @param {Number} d 
     * @returns {Number}
     */
    easeInOutCirc: function ( t, b, c, d ) {
        t /= d / 2;
        if ( t < 1 ) {
            return ( -c / 2 ) * ( Math.sqrt( 1 - t * t ) - 1 ) + b;
        }
        t -= 2;
        return ( c / 2 ) * ( Math.sqrt( 1 - t * t ) + 1 ) + b;
    }
};

/**
 * 
 * @param {Number|BigInt} dividend 
 * @param {Number|BigInt} divisor 
 * @param {Number} accuracy
 * @returns {{integer:BigInt,digits:Number[]}}
 */
export function div( dividend, divisor, accuracy = 100 ) {
        
    function add_digit( bigFloat, digit ) {
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

    const BigFloat = { integer: 0n, digits: [[]] };

    BigFloat.integer = BigIntQuotient;

    Object.defineProperty( BigFloat, 'toString', {
        value: function toString() {
            if ( this.digits.length > 0 ) {
                return `${this.integer}.${this.digits.map( r => r instanceof Array ? r.join( '' ) : r ).join( '' )}`.replace( /n/g, '' );
            }
            return `${this.integer}`;
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
        const remainder = r - ( quotient * BigIntDivisor );

        add_digit( BigFloat, Number( quotient ) );

        if ( remainder > 0 ) {
            r = remainder;
        }
        else {
            add_digit( BigFloat, Number( quotient ) );
            break;
        }

        if ( r < BigIntDivisor ) {
            r = r * 10n;
        }
    }
    return BigFloat;
}

/**
 * @param {Number|BigInt} number 
 * @param {Number|BigInt} factor 
 * @returns {BigInt}
 */
export function mul( number, factor ) {
    return BigInt( number ) * BigInt( factor );
}

/**
 * @param {Number} target
 * @returns {BigInt} 
 */
export function fact( target ) {
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
export function pow( number, exp ) {
    return BigInt( number ) ** BigInt( exp );
}

/**
 * @param {Number} number 
 * @returns {BigInt} 
 */
export function fib( index ) {
    let n0 = 0n;
    let n1 = 1n;
    for ( let nx = 2; nx <= index; nx += 1 ) {
        [n0, n1] = [n1, n0 + n1];
    }
    return n0;
}

export default { Easing, div, mul, pow, fact, fib };
