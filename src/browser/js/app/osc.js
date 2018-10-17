var widgetManager = require('./managers/widgets'),
    EventEmitter = require('./events/event-emitter'),
    ipc = require('./ipc/')

var Osc = class Osc extends EventEmitter {

    constructor() {

        super()

        this.syncOnly = false
        this.remoteControl = {}

    }

    send(data) {

        if (this.syncOnly) {

            this.sync(data)

        } else {

            ipc.send('sendOsc', data)

        }

    }

    sync(data) {

        ipc.send('syncOsc', data)

    }

    receive(data){

        if (this.remoteControl.exists(data.address)) this.remoteControl.exec(data.address, data.args)

        var [widgets, restArgs] = widgetManager.getWidgetByAddressAndArgs(data.address, data.args)

        for (let i in widgets) {
            let widgetTarget = widgets[i].getProp('target')
            // if the message target is provided (when message comes from another client connected to the same server)
            // then we only update the widgets that have the same target
            if (!data.target || !widgetTarget || String(widgetTarget) === String(data.target)) {
                // update matching widgets
                if (widgets[i] && widgets[i].setValue) widgets[i].setValue(restArgs,{send:false,sync:true,fromExternal:!data.target})
            }
        }

        this.trigger(data.address, [data.args])

    }

}


var osc = new Osc()

module.exports = osc

osc.remoteControl = require('./remote-control')
