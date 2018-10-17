var widgetManager = require('./managers/widgets'),
    stateManager = require('./managers/state')

var Parser = class Parser {

    constructor() {

        this.iterators = {}
        this.widgets = {}

    }

    getIterator(id) {

        this.iterators[id] = (this.iterators[id] || 0) + 1
        return this.iterators[id]

    }

    reset() {

        this.iterators = {}
        widgetManager.reset()

    }

    parse(options) {

        var {
            data,
            parentNode,
            parent,
            tab,
            reCreateOptions,
            children,
            index
            } = options

        if (!Array.isArray(data)) data = [data]

        for (let i in data) {

            var props = data[i]

            // Set default widget type
            props.type =  tab ? 'tab' : props.type || 'fader'

            // Backward compatibility patches
            if (props.path) props.address = props.path
            if (props.noPip) props.pips = !props.noPip
            if (props.noSync) {
                props.bypass = props.noSync
                delete props.noSync
            }
            // Safe copy widget's options
            let defaults = this.widgets[props.type].defaults()._props()

            // Set widget's undefined options to default
            for (let i in defaults) {
                if (i.indexOf('_')!=0 && props[i]===undefined) props[i] = defaults[i]
            }

            // Genrate widget's id, based on its type
            if (props.id=='auto' || !props.id ) {
                var id
                while (!id || widgetManager.getWidgetById(id).length) {
                    id=props.type+'_'+this.getIterator(props.type)
                }
                props.id = id
            }

            // Generate default address
            props.address = props.address == 'auto' ? '/' + props.id : props.address

            for (let j in props) {
                if (defaults[j] === undefined || j[0] === '_') delete props[j]
            }

            // create widget
            var widget = new this.widgets[props.type]({
                container:true,
                props,
                parent,
                parentNode,
                reCreateOptions,
                children
            })

            widgetManager.addWidget(widget)

            widget.created(index)

            // set widget's initial state
            var defaultValue = widget.getProp('default'),
                currentValue = widget.getProp('value')

            if (currentValue !== '' && currentValue !== undefined) {

                stateManager.pushValueNewProp(widget.getProp('id'), currentValue)

            } else if (defaultValue !== '' && defaultValue !== undefined) {

                widget.setValue(defaultValue)

            }


            parentNode.appendChild(widget.container)

        }

        // Editor needs to get the container object
        if (data && data.length==1) return widget

    }

}

var parser = new Parser()

module.exports = parser

parser.widgets = require('./widgets/').widgets
