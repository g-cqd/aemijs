import { inhibitEvent } from './event.js';

/**
 * Set of timing functions
 */
class Easing {
	constructor () { }
	static linearTween( t, b, c, d ) {
		return ( c * t ) / d + b;
	}
	static easeInQuad( t, b, c, d ) {
		t /= d;
		return c * t * t + b;
	}
	static easeOutQuad( t, b, c, d ) {
		t /= d;
		return -c * t * ( t - 2 ) + b;
	}
	static easeInOutQuad( t, b, c, d ) {
		t /= d / 2;
		if ( t < 1 ) {
			return ( c / 2 ) * t * t + b;
		}
		t--;
		return ( -c / 2 ) * ( t * ( t - 2 ) - 1 ) + b;
	}
	static easeInCubic( t, b, c, d ) {
		t /= d;
		return c * t * t * t + b;
	}
	static easeOutCubic( t, b, c, d ) {
		t /= d;
		t--;
		return c * ( t * t * t + 1 ) + b;
	}
	static easeInOutCubic( t, b, c, d ) {
		t /= d / 2;
		if ( t < 1 ) {
			return ( c / 2 ) * t * t * t + b;
		}
		t -= 2;
		return ( c / 2 ) * ( t * t * t + 2 ) + b;
	}
	static easeInQuart( t, b, c, d ) {
		t /= d;
		return c * t * t * t * t + b;
	}
	static easeOutQuart( t, b, c, d ) {
		t /= d;
		t--;
		return -c * ( t * t * t * t - 1 ) + b;
	}
	static easeInOutQuart( t, b, c, d ) {
		t /= d / 2;
		if ( t < 1 ) {
			return ( c / 2 ) * t * t * t * t + b;
		}
		t -= 2;
		return ( -c / 2 ) * ( t * t * t * t - 2 ) + b;
	}
	static easeInQuint( t, b, c, d ) {
		t /= d;
		return c * t * t * t * t * t + b;
	}
	static easeOutQuint( t, b, c, d ) {
		t /= d;
		t--;
		return c * ( t * t * t * t * t + 1 ) + b;
	}
	static easeInOutQuint( t, b, c, d ) {
		t /= d / 2;
		if ( t < 1 ) {
			return ( c / 2 ) * t * t * t * t * t + b;
		}
		t -= 2;
		return ( c / 2 ) * ( t * t * t * t * t + 2 ) + b;
	}
	static easeInSine( t, b, c, d ) {
		return -c * Math.cos( ( t / d ) * ( Math.PI / 2 ) ) + c + b;
	}
	static easeOutSine( t, b, c, d ) {
		return c * Math.sin( ( t / d ) * ( Math.PI / 2 ) ) + b;
	}
	static easeInOutSine( t, b, c, d ) {
		return ( -c / 2 ) * ( Math.cos( ( Math.PI * t ) / d ) - 1 ) + b;
	}
	static easeInExpo( t, b, c, d ) {
		return c * Math.pow( 2, 10 * ( t / d - 1 ) ) + b;
	}
	static easeOutExpo( t, b, c, d ) {
		return c * ( -Math.pow( 2, ( -10 * t ) / d ) + 1 ) + b;
	}
	static easeInOutExpo( t, b, c, d ) {
		t /= d / 2;
		if ( t < 1 ) {
			return ( c / 2 ) * Math.pow( 2, 10 * ( t - 1 ) ) + b;
		}
		t--;
		return ( c / 2 ) * ( -Math.pow( 2, -10 * t ) + 2 ) + b;
	}
	static easeInCirc( t, b, c, d ) {
		t /= d;
		return -c * ( Math.sqrt( 1 - t * t ) - 1 ) + b;
	}
	static easeOutCirc( t, b, c, d ) {
		t /= d;
		t--;
		return c * Math.sqrt( 1 - t * t ) + b;
	}
	static easeInOutCirc( t, b, c, d ) {
		t /= d / 2;
		if ( t < 1 ) {
			return ( -c / 2 ) * ( Math.sqrt( 1 - t * t ) - 1 ) + b;
		}
		t -= 2;
		return ( c / 2 ) * ( Math.sqrt( 1 - t * t ) + 1 ) + b;
	}
}

/**
 * Apply a smooth scroll animation when navigating through a page
 * 
 * #browser-only
 * 
 * @param {Event} event 
 * @param {String} selector 
 * @param {Number} duration 
 */
const smoothScrollTo = function ( event, selector, duration ) {
	inhibitEvent( event );
	const easing = Easing.easeInOutCubic;
	let target = document.querySelector( selector );
	if ( !( target instanceof HTMLElement ) ) return;
	let startPosition = window.pageYOffset;
	let targetPosition = startPosition + target.getBoundingClientRect().top;
	duration = duration || 1000;
	let distance = targetPosition - startPosition;
	let startTime = null;
	function animation( currentTime ) {
		startTime = !!startTime ? startTime : currentTime;
		let timeElapsed = currentTime - startTime;
		let run = easing( timeElapsed, startPosition, distance, duration );
		window.scrollTo( 0, run );
		if ( timeElapsed < duration ) {
			window.requestAnimationFrame( animation );
		}
	}
	window.requestAnimationFrame( animation );
}

export {
	Easing,
	smoothScrollTo
};
