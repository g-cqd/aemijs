/* eslint-env browser,worker */

class ExtenderWorkerHandler {
	constructor () {
		this.listeners = {};
		this.addTypeListener( 'default', value => value );
		this.self.onmessage = messageEvent => {
			this.listen( messageEvent );
		};
	}

	get self() {
		return globalThis;
	}

	listen( messageEvent ) {
		const { id, data } = messageEvent.data;
		if ( typeof data === 'object' && 'type' in data ) {
			if ( data.type in this.listeners ) {
				this.listeners[data.type]( id, data, messageEvent );
			} else {
				this.listeners.default( id, data, messageEvent );
			}
		} else {
			this.listeners.default( id, data, messageEvent );
		}
	}

	/**
	 * @param {String} type 
	 * @param {Function} func 
	 * @param {{
		 keepMessageEvent:Boolean,
		 propertyAccessor:Any
	 * }} options 
	 */
	addTypeListener( type, func, options = {} ) {
		const _async = func.constructor.name === 'AsyncFunction';
		const { keepMessageEvent, propertyAccessor } = options;
		this.listeners[type] = ( id, data, messageEvent ) => {
			const _data = propertyAccessor ? data[propertyAccessor] : data;
			const _args = keepMessageEvent ? [messageEvent, _data] : [_data];
			const _value = func( ..._args );
			if ( _value instanceof Promise ) {
				_value.then( value => {
					this.self.postMessage( { id, data: value } );
				} );
			} else {
				this.self.postMessage( { id, data: _value } );
			}
		};
	}
}

( globalThis || self || window ).listeners = new ExtenderWorkerHandler();
