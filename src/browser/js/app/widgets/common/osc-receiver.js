var osc = require('../../osc')

module.exports = class OscReceiver {

    constructor(address, value, parent, propName) {

        try {
            this.value = JSON.parse(value)
        } catch (err) {
            this.value = value
        }

        this.parent = parent
        this.propName = propName
        this.bindedCallback = this.callback.bind(this)
        this.setAddress(address)

    }

    setAddress(address) {

        if (this.address !== address) {

            if (this.address) osc.off(this.address, this.bindedCallback)

            this.address = address
            osc.on(this.address, this.bindedCallback, {context: this.parent})

        }

    }

    callback(args) {

        if (typeof args !== 'object') args = [args]
        var preArgs = this.parent.getProp('preArgs') || []
        if (!Array.isArray(preArgs) && preArgs !== '') preArgs = [preArgs]
        if (args.length >= preArgs.length) {
            for (var i in preArgs) {
                if (preArgs[i] !== args[i]) return
            }
            var val = args.slice(preArgs.length)
            if (val.length < 2) val = val[0]
            try {
                this.value = JSON.parse(val)
            } catch (err) {
                this.value = val
            }
            this.parent.updateProps([this.propName], this.parent)
        }

    }

}
