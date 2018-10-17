var {updateWidget} = require('./editor/data-workers'),
    editor = require('./editor'),
    widgetManager = require('./managers/widgets'),
    deepExtend = require('deep-extend')

var callbacks = {
    '/EDIT': function(args) {

        if (READ_ONLY) return

        var [id, json] = args,
            newdata = typeof json == 'string' ? JSON.parseFlex(json) : json,
            widgets = widgetManager.getWidgetById(id)

        if (!widgets.length) return

        for (var i = widgets.length - 1; i >= 0; i--) {

            var widget = widgets[i],
                data = widget.props

            for (var k in newdata) {
                data[k] = newdata[k]
            }

            updateWidget(widget, {
                remote: true,
                reuseChildren: !(newdata.widgets || newdata.tabs)
            })

        }

        editor.pushHistory()

    },
    '/EDIT/MERGE': function(args) {

        if (READ_ONLY) return

        var [id, json] = args,
            newdata = typeof json == 'string' ? JSON.parseFlex(json) : json,
            widgets = widgetManager.getWidgetById(id)

        if (!widgets.length) return

        for (var i = widgets.length - 1; i >= 0; i--) {

            var widget = widgets[i],
                data = widget.props

            deepExtend(data, newdata)

            updateWidget(widget, {
                remote: true,
                reuseChildren: !(newdata.widgets || newdata.tabs)
            })

        }

        editor.pushHistory()

    },
    '/EDIT/UNDO': function(args) {

        if (READ_ONLY) return

        editor.undo()

    },
    '/EDIT/REDO': function(args) {

        if (READ_ONLY) return

        editor.redo()

    },
    '/EDIT/GET': function(args) {

        var [target, idOrAddress, ...preArgs] = args,
            widgets = []

        if (idOrAddress[0] == '/') {

            widgets = widgetManager.getWidgetByAddress(
                widgetManager.createAddressRef(null, preArgs, idOrAddress)
            )

        } else {

            widgets = widgetManager.getWidgetById(idOrAddress)

        }

        for (var i = widgets.length - 1; i >= 0; i--) {

            return widgets[i].sendValue({
                target: [target],
                address: '/EDIT/GET',
                preArgs: [idOrAddress, ...preArgs],
                v: JSON.stringify(widgets[i].props),
                noSync: true
            }, {force: true})

        }

    },
    '/GET': function(args, transparentReply) {

        var [target, idOrAddress, ...preArgs] = args,
            widgets = []

        if (idOrAddress[0] == '/') {

            widgets = widgetManager.getWidgetByAddress(
                widgetManager.createAddressRef(null, preArgs, idOrAddress)
            )

        } else {

            widgets = widgetManager.getWidgetById(idOrAddress)

        }

        for (var i = widgets.length - 1; i >= 0; i--) {

            let overrides = {
                target: [target],
                noSync: true
            }

            if (!transparentReply) {

                overrides.address = '/GET'
                overrides.preArgs = [idOrAddress, ...preArgs]

            }

            return widgets[i].sendValue(overrides, {force: true})

        }

    },
    '/GET/#': function(args) {

        callbacks['/GET'](args, true)

    },
    '/SET': function(args) {

        var [idOrAddress, ...preArgsOrValue] = args,
            widgets = [],
            value = null

        if (idOrAddress[0] == '/') {

            [widgets, value] = widgetManager.getWidgetByAddressAndArgs(
                idOrAddress,
                preArgsOrValue
            )

        } else {

            widgets = widgetManager.getWidgetById(idOrAddress)
            value = preArgsOrValue
            if (value.length == 0) value = null
            else if (value.length == 1) value = value[0]

        }

        for (var i = widgets.length - 1; i >= 0; i--) {

            return widgets[i].setValue(value, {
                sync: true,
                send: true
            })

        }

    },
    '/TABS': function(args) {

        if (!Array.isArray(args)) args = [args]

        for (let id of args) {
            let ws = widgetManager.getWidgetById(id)
            for (let w of ws) {
                DOM.each(document, `.tablink[data-widget="${w.hash}"]`, (el)=>{
                    DOM.dispatchEvent(el, 'fast-click', {})
                })
            }
        }

    }
}

// backward-compatibility
callbacks['/EDIT_SOFT'] = callbacks['/EDIT/MERGE']

module.exports = {
    exec: function(name, args){
        if (callbacks[name]) {
            callbacks[name](args)
        }
    },
    exists: function(name){
        return name in callbacks
    }
}
