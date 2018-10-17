var EventEmitter = require('../events/event-emitter'),
    ipc = require('../ipc/')

var WidgetManager = class WidgetManager extends EventEmitter {

    constructor() {

        super()

        this.widgets = {}
        this.children = []

        this.addressRoute = {}
        this.idRoute = {}
        this.linkIdRoute = {}

        this.linkIdLock = []
        this.linkIdLockDepth = 0

        this.scrollingWidgets = []

        this.preArgsSeparator = '||||'

        this.on('change', this.onChange, this)

        ipc.on('connect', ()=>{
            for (var hash in this.widgets) {
                this.registerWidget(this.widgets[hash])
            }
        })

    }

    onChange(e) {

        var {id, widget, linkId, options} = e

        if (linkId) {
            if (!Array.isArray(linkId)) linkId = [linkId]
            linkId = linkId.map(x=>x.replace(/^>>\s*/, '')).filter(x=>x.indexOf('<<') < 0)
            linkId = linkId.filter(x=>this.linkIdLock.indexOf(x)<0)
            this.linkIdLock = this.linkIdLock.concat(linkId)
            this.linkIdLockDepth++
        }

        var widgetsById = this.getWidgetById(id),
            widgetsByLinkId = linkId ? this.getWidgetByLinkId(linkId) : []

        // Widget that share the same id will update each other
        // without sending any extra osc message
        if (widgetsById.length > 1) {
            let v = widget.getValue()
            for (let i in widgetsById) {
                if (widgetsById[i] !== widget) {
                    widgetsById[i].setValue(v,{send:false,sync:false})
                }
            }
        }

        // widgets that share the same linkId will update each other.
        // Updated widgets will send osc messages normally
        if (widgetsByLinkId.length > 0) {
            let v = widget.getValue()
            for (let i in widgetsByLinkId) {
                if (widgetsByLinkId[i] !== widget) {
                    widgetsByLinkId[i].setValue(v,{send: options.send,sync: true})
                }
            }
        }

        if (linkId && this.linkIdLockDepth) {
            this.linkIdLockDepth--
            if (!this.linkIdLockDepth) {
                this.linkIdLock = []
            }
        }

    }

    createAddressRef(widget, preArgs, address) {

        preArgs = widget ? widget.getProp('preArgs') : preArgs
        address = widget ? widget.getProp('address') : address

        if (!Array.isArray(preArgs) && preArgs !== '') preArgs = [preArgs]
        if (preArgs === '') preArgs = []

        preArgs = preArgs.map(x=>typeof x === 'object' && x !== null && x.value !== undefined ? x.value : x)

        return preArgs && preArgs.length ?
            address + this.preArgsSeparator + preArgs.join(this.preArgsSeparator)
            : address

    }

    addWidget(widget) {

        var hash = widget.hash,
            address = this.createAddressRef(widget),
            id = widget.getProp('id'),
            linkId = widget.getProp('linkId'),
            scroll = widget.getProp('scroll')


        this.widgets[hash] = widget

        if (!this.idRoute[id]) this.idRoute[id] = []
        this.idRoute[id].push(hash)

        if (address) {
            if (!this.addressRoute[address]) this.addressRoute[address] = []
            this.addressRoute[address].push(hash)
        }

        if (linkId) {
            if (!Array.isArray(linkId)) linkId = [linkId]
            linkId = linkId.map(x=>x.replace(/^<<\s*/, '')).filter(x=>x.indexOf('>>') < 0)
            for (var i in linkId) {
                if (linkId[i]) {
                    if (!this.linkIdRoute[linkId[i]]) this.linkIdRoute[linkId[i]] = []
                    this.linkIdRoute[linkId[i]].push(hash)
                }
            }
        }

        if (scroll) {
            this.scrollingWidgets.push(hash)
        }

        this.registerWidget(widget)

    }

    registerWidget(widget, updatedData, oldData) {

        ipc.send('addWidget', {
            hash: widget.hash,
            data: updatedData || {
                precision: widget.getProp('precision'),
                preArgs: widget.getProp('preArgs'),
                split: widget.getSplit(),
                target: widget.getProp('target'),
                address: widget.getProp('address'),
                noSync: widget.getProp('noSync'),
            }
        })

        if (updatedData && oldData) {
            var address = this.createAddressRef(null, oldData.preArgs, oldData.address),
                newAddress = this.createAddressRef(widget),
                hash = widget.hash

            if (address && this.addressRoute[address].indexOf(hash) != -1) this.addressRoute[address].splice(this.addressRoute[address].indexOf(hash), 1)

            if (!this.addressRoute[newAddress]) this.addressRoute[newAddress] = []
            this.addressRoute[newAddress].push(hash)
        }

    }

    removeWidget(widget) {

        var hash = widget.hash,
            address = this.createAddressRef(widget),
            linkId =  widget.getProp('linkId'),
            id = widget.getProp('id'),
            scroll = widget.getProp('scroll')

        if (this.widgets[hash]) {
            if (this.widgets[hash].onRemove) this.widgets[hash].onRemove()

            delete this.widgets[hash]

            ipc.send('removeWidget', {
                hash:hash
            })

            widget.trigger('widget-removed', [{widget: widget}])

        }
        if (id && this.idRoute[id].indexOf(hash) != -1) this.idRoute[id].splice(this.idRoute[id].indexOf(hash), 1)
        if (address && this.addressRoute[address].indexOf(hash) != -1) this.addressRoute[address].splice(this.addressRoute[address].indexOf(hash), 1)
        if (scroll && this.scrollingWidgets.indexOf(hash) != -1) this.scrollingWidgets.splice(this.scrollingWidgets.indexOf(hash), 1)

        if (!Array.isArray(linkId)) linkId = [linkId]
        for (var i in linkId) {
            if (linkId[i] && this.linkIdRoute[linkId[i]] && this.linkIdRoute[linkId[i]].indexOf(hash) != -1) this.linkIdRoute[linkId[i]].splice(this.linkIdRoute[linkId[i]].indexOf(hash), 1)
        }

    }

    removeWidgets(widgets, nested) {

        for (let i in widgets) {

            if (Array.isArray(widgets[i])) {

                this.removeWidgets(widgets[i], true)

            } else if (this.widgets[widgets[i].hash]) {

                this.removeWidget(widgets[i])

            }

        }

        if (!nested) this.purge()

    }

    purge() {

        for (let route of [this.addressRoute, this.idRoute, this.linkIdRoute]) {
            for (let key in route) {
                for (let i=route[key].length-1; i>=0; i--) {
                    let hash = route[key][i]
                    if (!this.widgets[hash]) {
                        route[key].splice(i, 1)
                    }
                }
            }
        }

        for (let i in this.scrollingWidgets) {
            if (!this.widgets[this.scrollingWidgets[i]]) {
                this.scrollingWidgets.splice(i, 1)
            }
        }

    }

    reset() {

        this.removeWidgets(Object.values(this.widgets))

        this.removeEvent()

        this.on('change', this.onChange, this)

    }


    getWidgetBy(key, dict, widgets = []) {

        var hash, w

        if (Array.isArray(key)) {
            for (let i in key) {
                this.getWidgetBy(key[i], dict, widgets)
            }
            return widgets
        }

        if (dict[key]) {
            for (let i = dict[key].length-1; i>=0; i--) {
                hash = dict[key][i]
                w = this.widgets[hash]
                if (!w) {
                    dict[key].splice(i,1)
                } else if (widgets.indexOf(w) == -1) {
                    widgets.push(w)
                }
            }
        }

        return widgets

    }

    getWidgetById(id) {

        return this.getWidgetBy(id, this.idRoute)

    }

    getWidgetByLinkId(linkId) {

        return this.getWidgetBy(linkId, this.linkIdRoute)

    }

    getWidgetByAddress(address) {

        return this.getWidgetBy(address, this.addressRoute)

    }

    getWidgetByAddressAndArgs(address, args) {

        var addressref = address,
            restArgs = args

        if (typeof args == 'object' && args != null) {
            for (var i = args.length; i >= 0; i--) {

                var ref = this.createAddressRef(null, args.slice(0,i), address)

                if (this.getWidgetByAddress(ref).length) {
                    addressref = ref
                    restArgs = args.slice(i, args.length)
                    break
                }

            }
        } else {
            restArgs = args
        }


        if (restArgs == null || restArgs.length == 0) restArgs = null
        else if (restArgs.length == 1) restArgs = restArgs[0]


        var widgets = this.getWidgetByAddress(addressref)

        return [
            widgets,
            restArgs
        ]

    }

    getWidgetByElement(e, filter = '') {
        var element = e ? e.closest('[data-widget]' + filter) : undefined
        if (element) {
            return element._widget_instance ?
                element._widget_instance :
                this.widgets[element.getAttribute('data-widget')]
        }
    }

}

var widgetManager = new WidgetManager()

module.exports = widgetManager
