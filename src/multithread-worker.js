/* eslint-env browser,worker */

class ExtendedWorkerHandler {

    /**
     * @typedef {Object} ExtendedWorkerListenerOptions
     * @property {boolean} keepMessageEvent
     * @property {string} propertyAccessor
     */

    /**
     * @typedef {ExtendedWorkerHandler & Proxy} ExtendedWorkerHandlerProxy
     */

    constructor() {
        this.typeListeners = {};
        this.addTypeListener( 'default', value => value );
        this.self.onmessage = message => this.listen( message );
        this.self._ = this.proxy;
    }

    /**
     * @returns {globalThis}
     */
    // eslint-disable-next-line class-methods-use-this
    get self() {
        return globalThis || window;
    }

    /**
     * @returns {ExtendedWorkerHandlerProxy}
     */
    get proxy() {
        return new Proxy( this, {
            get: ( target, property ) => {
                if ( property in target ) {
                    return target[property];
                }
                return ( func, options ) => target.addTypeListener( property, func, options || { propertyAccessor: 'data' } );
            }
        } );
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
            }
            else {
                this.typeListeners.default( id, data, messageEvent );
            }
        }
        else {
            this.typeListeners.default( id, data, messageEvent );
        }
    }

    /**
     * @param {String} type - Message Type to look for when receiving a message
     * @param {Function} func - Message Handler to call
     * @param {ExtendedWorkerListenerOptions} [options] - Options used to parse message data
     * @returns {void}
     */
    addTypeListener( type, func, options = {} ) {
        const { keepMessageEvent, propertyAccessor } = options;
        this.typeListeners[type] = ( id, data, messageEvent ) => {
            const _data = propertyAccessor ? data[propertyAccessor] : data;
            const _args = keepMessageEvent ? [ messageEvent, _data ] : [ _data ];
            const _value = func( ..._args );
            if ( _value instanceof Promise ) {
                _value.then( value => {
                    this.self.postMessage( { id, data: value } );
                } ).catch( console.error );
            }
            else {
                this.self.postMessage( { id, data: _value } );
            }
        };
    }

}

( globalThis || self || window ).listeners = new ExtenderWorkerHandler();
