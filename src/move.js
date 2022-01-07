/* eslint-env module */

import { Easing } from './math.js';

/**
 * Apply a smooth scroll animation when navigating through a page
 *
 * #browser-only
 *
 * @param {Event} event - The event object
 * @param {String} selector - CSS selector of the element to scroll to
 * @param {Number} duration - Duration of the animation in milliseconds
 */
export function smoothScrollTo( event, selector, duration = 1000 ) {
    event.preventDefault();
    event.stopPropagation();
    const { easeInOutCubic } = Easing;
    const target = document.querySelector( selector );
    if ( !( target instanceof HTMLElement ) ) {
        return;
    }
    const startPosition = window.pageYOffset;
    const targetPosition = startPosition + target.getBoundingClientRect().top;
    const distance = targetPosition - startPosition;
    let startTime = 0;

    /**
     * @param {Number} currentTime
     */
    function animation( currentTime ) {
        startTime = startTime ? startTime : currentTime;
        const timeElapsed = currentTime - startTime;
        const run = easeInOutCubic( timeElapsed, startPosition, distance, duration );
        window.scrollTo( 0, run );
        if ( timeElapsed < duration ) {
            window.requestAnimationFrame( animation );
        }
    }

    window.requestAnimationFrame( animation );
}

export default { smoothScrollTo };

