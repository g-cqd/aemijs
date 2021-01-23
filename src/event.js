/**
 * Inhibit Propagation and Default Behavior of an Event
 * @param {Event} event
 */
const inhibitEvent = function ( event ) {
	event.preventDefault();
	event.stopPropagation();
}

export { inhibitEvent };
