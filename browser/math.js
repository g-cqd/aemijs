/* eslint-env browser */

/**
 * Set of timing functions
 */
const Easing = {
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
