/* eslint-env browser */

/**
 * Apply a smooth scroll animation when navigating through a page
 * 
 * #browser-only
 * 
 * @param {Event} event 
 * @param {String} selector 
 * @param {Number} duration 
 */
function smoothScrollTo ( event, selector, duration = 1000 ) {
    event.preventDefault();
	event.stopPropagation();
    const { easeInOutCubic } = Easing;
    const target = document.querySelector( selector );
    if ( !( target instanceof HTMLElement ) ) {
        return;
    };
    const startPosition = window.pageYOffset;
    const targetPosition = startPosition + target.getBoundingClientRect().top;
    const distance = targetPosition - startPosition;
    let startTime = 0;
    
    /**
     * @param {Number} currentTime 
     */
    function animation( currentTime ) {
        startTime = !!startTime ? startTime : currentTime;
        const timeElapsed = currentTime - startTime;
        const run = easeInOutCubic( timeElapsed, startPosition, distance, duration );
        window.scrollTo( 0, run );
        if ( timeElapsed < duration ) {
            window.requestAnimationFrame( animation );
        }
    }

    window.requestAnimationFrame( animation );
}
