var widgetManager = require('../managers/widgets'),
    resize = require('../events/resize'),
    stateManager = require('../managers/state'),
    parser = require('../parser'),
    {deepCopy, deepEqual} = require('../utils'),
    Panel,
    sidepanel,
    editor

DOM.ready(()=>{
    sidepanel = DOM.get('#sidepanel')[0]
})

function updateWidget(widget, options={}) {

    var reuseChildren = options.reuseChildren !== false && widget instanceof Panel

    if(!options.forceRecreation ){
        const changedObj = getChangedProps(widget);
        if(!nonDynamicPropChanged(changedObj)){


            function triggerChange(changedObj){
                const {widget,childrens,changed} = changedObj
                for(var i in childrens){
                    triggerChange(childrens[i])
                }
                for(var i in changed){
                    options ={}
                    for (var i in changedProps) {
                        widget.onPropChanged(changedProps[i].propName, options, changedProps[i].oldPropValue)
                    }

                    widget.trigger('prop-changed.*', [{
                        id: widget.getProp('id'),
                        props: changedProps,
                        widget: widget,
                        options: options
                    }])

                }
            }
            triggerChange(changedObj)
            return widget
        }


    }
    // save state
    stateManager.incrementQueue()
    var toSave = [widget],
        sidepanelScroll = sidepanel.scrollTop,
        scrollState = {}
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
            scrollState[w.getProp('id')] = w.scroll()
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

    if (newWidget.getProp('type') === 'tab') newWidget.parent.trigger('tab-created', [{widget: widget}])
    if (newWidget.getProp('id') === 'root') DOM.get('.editor-root')[0].setAttribute('data-widget', newWidget.hash)


    if (reuseChildren && !(newWidget instanceof Panel)) {
        // remove remaining children if widget is not a container anymore
        widgetManager.removeWidgets(widget.getAllChildren())
    }

    if (reuseChildren) {
        // children don't listen to their parent's 'widget-created' event
        // so we have to let them know it's been updated
        widgetManager.trigger('prop-changed', [{
            id: newWidget.getProp('id'),
            props: [],
            widget: newWidget,
            options: {}
        }])
    }

    resize.check(newWidget.container)

    // restore state
    stateManager.decrementQueue()
    for (let id in scrollState) {
        for (let w of widgetManager.getWidgetById(id)) {
            if (w.scroll) w.scroll(scrollState[id])
        }
    }
    sidepanel.scrollTop = sidepanelScroll

    if (editor.selectedWidgets.includes(widget) && !options.preventSelect) {
        editor.select(newWidget)
    }

    return newWidget

}


function nonDynamicPropChanged(changedObj){
    for(var k of changedObj.changedProps){
        if(!changedObj.widget.constructor.dynamicProps.includes(k.propName)){
            return true
        }
    }
    for(var o of changedObj.childrens){
        if(nonDynamicPropChanged(o)){return true}

    }
}

function getChangedProps(widget){
    const res = {widget,'changedProps':[],'childrens':[]}
    for(var k in widget.cachedProps){
        const p = widget.cachedProps[k]
        const np = widget.resolveProp(k, undefined, false)
        if(!deepEqual(np,p)){
            res.changedProps.push({'propName':k,'oldPropValue':p})
        }
    }

    for( var c in widget.childrens){
        res.childrens.push(getChangedProps(widget.children[c]))
    }

    return res;

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
