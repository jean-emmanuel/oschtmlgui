var EE3 = require('eventemitter3'),
    customEvents = {}

customEvents['draginit'] = customEvents['drag'] = customEvents['dragend']  = require('./drag')
customEvents['resize']  = require('./resize')

module.exports = class EventEmitter extends EE3 {

    constructor() {

        super()

        this._customBindings = {}

        for (var evt in customEvents) {
            this._customBindings[evt] = {
                bindings: 0
            }
        }

    }

    emit(evt, args) {

        // Event bubbling

        var ret = super.emit(evt, args)

        if (args && !args.stopPropagation) {
            if (this.parent) this.parent.emit(evt, args)
        }

        return ret

    }

    trigger(evt, args) {

        return this.emit(evt, args)

    }

    on(evt, listener, context, options) {

        // Custom event setup

        if (
            customEvents.hasOwnProperty(evt) &&
            typeof customEvents[evt].setup === 'function'
        ) {
            if (this._customBindings[evt].bindings === 0) {
                this._customBindings[evt].options = options
                customEvents[evt].setup.call(this, options)
            }
            this._customBindings[evt].bindings += 1
        }

        return super.on(evt, listener, context)

    }

    removeListener(evt, listener, context, once) {

        // Custom event teardown

        if (
            customEvents.hasOwnProperty(evt) &&
            typeof customEvents[evt].teardown === 'function' &&
            this._customBindings[evt].bindings !== 0
        ) {
            this._customBindings[evt].bindings -= 1
            if (this._customBindings[evt].bindings === 0 || !listener) {
                var options = this._customBindings[evt].options
                customEvents[evt].teardown.call(this, options)
            }
        }

        return super.removeListener(evt, listener, context, once)

    }

}
