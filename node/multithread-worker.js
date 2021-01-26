/* eslint-env node,worker */
const { parentPort } = require( 'worker_threads' );

class ExtenderWorkerHandler {
    constructor () {
        this.mainThread = parentPort;
		this.typeListeners = {};
        this.addTypeListener( 'default', value => value );
        this.mainThread.on( 'message', messageEvent => {
            this.listen( messageEvent );
        } );
	}

    /**
     * @returns {globalThis}
     */
	get self() {
		return globalThis;
	}

    /**
     * @param {MessageEvent} messageEvent 
     * @returns {void}
     */
	listen( messageEvent ) {
		const { id, data } = messageEvent.data;
		if ( typeof data === 'object' && 'type' in data ) {
			if ( data.type in this.typeListeners ) {
				this.typeListeners[data.type]( id, data, messageEvent );
			} else {
				this.typeListeners.default( id, data, messageEvent );
			}
		} else {
			this.typeListeners.default( id, data, messageEvent );
		}
	}

	/**
	 * @param {String} type - Message Type to look for when receiving a message
	 * @param {Function} func - Message Handler to call
	 * @param {{
     *   keepMessageEvent:Boolean,
     *   propertyAccessor:String
     * }} [options] - Options used to parse message data
     * @returns {void}
	 */
	addTypeListener( type, func, options = {} ) {
		const { keepMessageEvent, propertyAccessor } = options;
		this.typeListeners[type] = ( id, data, messageEvent ) => {
			const _data = propertyAccessor ? data[propertyAccessor] : data;
			const _args = keepMessageEvent ? [messageEvent, _data] : [_data];
			const _value = func( ..._args );
			if ( _value instanceof Promise ) {
				_value.then( value => {
					this.mainThread.postMessage( { id, data: value } );
				} );
			} else {
				this.mainThread.postMessage( { id, data: _value } );
			}
		};
	}
}

( globalThis || self || window ).listeners = new ExtenderWorkerHandler();
