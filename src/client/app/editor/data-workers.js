var widgetManager = require('../managers/widgets'),
    resize = require('../events/resize'),
    stateManager = require('../managers/state'),
    parser = require('../parser'),
    Panel,
    sidepanel,
    editor,
    scrollState = {},
    sidepanelScroll

DOM.ready(()=>{
    sidepanel = DOM.get('#sidepanel')[0]
})

function updateWidget(widget, options={}) {

    if (options.changedProps) {
        // alternate routine for small edits
        var propNames = options.changedProps,
            propValues = propNames.map(x => widget.props[x]),
            linkedProps = []

        Object.values(widget.nestedLinkedProps).forEach(l => linkedProps = linkedProps.concat(l))
        Object.values(widget.linkedProps).forEach(l => linkedProps = linkedProps.concat(l))
        Object.values(widget.linkedPropsValue).forEach(l => linkedProps = linkedProps.concat(l))
        Object.values(widget.oscReceivers).forEach(r => linkedProps = linkedProps.concat(r.propNames))

        if (
            // if non dynamic props have changed, skip this and use rebuild routine
            !propNames.some(n => !widget.constructor.dynamicProps.includes(n))
        ) {

            var edited = widget.updateProps(options.changedProps, null) || widget

            if (
                // if prop/osc listeners have changed (@{} / OSC{})
                // refresh the widget's props cache and update linked props bindings
                propValues.some(x => typeof x === 'string' && x.match(/OSC\{|@\{/))
            ||  propNames.some(n => linkedProps.includes(n))
            ) {
                widget.createPropsCache()
            }

            if (editor.selectedWidgets.includes(widget) && !options.preventSelect) {
                editor.select(edited)
            }

            return edited

        }

    }


    var reuseChildren = options.reuseChildren !== false && widget instanceof Panel

    // save state
    if (stateManager.queueCounter === 0) {
        sidepanelScroll = sidepanel.scrollTop
        scrollState = {}
    }
    stateManager.incrementQueue()
    var toSave = [widget]
    if (!reuseChildren) {
        toSave = toSave.concat(widget.getAllChildren())
    }
    for (let w of toSave) {
        if (widgetManager.widgets[w.hash]) {
            let id = w.getProp('id'),
                value = w.getValue(),
                valueProp = w.getProp('value')

            stateManager.pushValueState(id, value)
            if (valueProp !== '' && valueProp !== undefined) stateManager.pushValueOldProp(id, valueProp)
        }
        if (widgetManager.scrollingWidgets.indexOf(w.hash) > -1 && w.scroll) {
            var s = w.scroll()
            if (s[0] !== 0 || s[1] !== 0) {
                scrollState[w.getProp('id')] = s
            }
        }
    }

    var children = undefined,
        removedChildren = []

    if (reuseChildren) {
        children = [...widget.children]
        if (options.removedIndexes) {
            options.removedIndexes = options.removedIndexes.sort((a, b) => b - a)
            for (let i of options.removedIndexes) {
                removedChildren.push(children.splice(i, 1)[0])
            }
        }
        if (options.addedIndexes) {
            options.addedIndexes = options.addedIndexes.sort((a, b) => a - b)
            for (let i of options.addedIndexes) {
                children.splice(i, 0, null)
            }
        }

    }

    // get widget's index
    var index = widget.parent.children.indexOf(widget)

    // remove old widgets
    var removedWidgets = reuseChildren ?
            removedChildren.map(x => x.getAllChildren().concat(x)).concat(widget) :
            widget.getAllChildren().concat(widget)

    widgetManager.removeWidgets(removedWidgets)

    // create new widget
    var newWidget = parser.parse({
        data: widget.props,
        parent: widget.parent,
        parentNode: widget.parentNode,
        reCreateOptions: options.reCreateOptions,
        children: children,
        index: index
    })


    newWidget.container.parentNode.replaceChild(newWidget.container, widget.container)

    if (newWidget.getProp('type') === 'tab') newWidget.parent.trigger('tab-created', {widget: widget})
    if (newWidget.getProp('id') === 'root') DOM.get('.editor-root')[0].setAttribute('data-widget', newWidget.hash)


    if (reuseChildren && !(newWidget instanceof Panel)) {
        // remove remaining children if widget is not a container anymore
        widgetManager.removeWidgets(widget.getAllChildren())
    }

    if (reuseChildren) {
        // children don't listen to their parent's 'widget-created' event
        // so we have to let them know it's been updated
        widgetManager.trigger('prop-changed', {
            id: newWidget.getProp('id'),
            props: [],
            widget: newWidget,
            options: {}
        })
    }

    resize.check(newWidget.container)

    // restore state
    stateManager.decrementQueue()
    if (stateManager.queueCounter === 0) {
        sidepanel.scrollTop = sidepanelScroll
        for (let id in scrollState) {
            for (let w of widgetManager.getWidgetById(id)) {
                if (w.scroll) w.scroll(scrollState[id])
            }
        }
    }

    if (editor.selectedWidgets.includes(widget) && !options.preventSelect) {
        editor.select(newWidget)
    }

    return newWidget

}


var fakeStore = {}

var incrementWidget = function(data, root){

    if (!data) return

    if (root !== false) {
        fakeStore = {
            id:[],
            address:[]
        }
    }

    var id = data.id,
        address = data.address

    if (id && address == '/'+id) {

        data.address = 'auto'

    } else if (address){
        var addressref
        while (fakeStore.address.indexOf(address) != -1 || widgetManager.getWidgetByAddress(addressref).length) {
            address = address.replace(/([0-9]*)$/,function(m){
                var n = parseInt(m)+1
                n = isNaN(n)?1:n
                return n
            })
            addressref = widgetManager.createAddressRef(null, data.preArgs,address)
        }

        fakeStore.address.push(address)

        data.address = address

    }

    if (id) {
        while (fakeStore.id.indexOf(id) != -1 || widgetManager.getWidgetById(id).length) {
            id = id.replace(/([0-9]*)$/,function(m){
                var n = parseInt(m)+1
                n = isNaN(n)?1:n
                return n
            })
        }

        fakeStore.id.push(id)

        data.id = id

    }

    if (data.widgets && data.widgets.length) {
        for (let i in data.widgets) {
            data.widgets[i] = incrementWidget(data.widgets[i], false)
        }
    }

    if (data.tabs && data.tabs.length) {
        for (let i in data.tabs) {
            data.tabs[i] = incrementWidget(data.tabs[i], false)
        }
    }

    return data

}

module.exports = {
    updateWidget:updateWidget,
    incrementWidget:incrementWidget
}

editor = require('./')
Panel = require('../widgets/containers/panel')
