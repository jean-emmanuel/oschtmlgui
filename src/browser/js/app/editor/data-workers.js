var widgetManager = require('../managers/widgets'),
    resize = require('../events/resize'),
    stateManager = require('../managers/state'),
    parser = require('../parser'),
    {deepCopy, deepEqual} = require('../utils'),
    editor

var updateWidget = function(widget, options = {}) {

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
    var sidepanel = DOM.get('#sidepanel')[0],
        scroll = sidepanel.scrollTop,
        oldWidgets = widget.getAllChildren().concat(widget),
        wasSelected = editor.selectedWidgets.includes(widget),
        wScroll = {}

    stateManager.incrementQueue()


    for (let widget of oldWidgets) {
        if (widgetManager.widgets[widget.hash]) {
            let id = widget.getProp('id'),
                value = widget.getValue(),
                valueProp = widget.getProp('value')

            stateManager.pushValueState(id, value)
            if (valueProp !== '' && valueProp !== undefined) stateManager.pushValueOldProp(id, valueProp)
        }
    }

    // save scroll states
    for (let h of widgetManager.scrollingWidgets) {
        if (widgetManager.widgets[h] && widgetManager.widgets[h].scroll) {
            wScroll[widgetManager.widgets[h].getProp('id')] = widgetManager.widgets[h].scroll()
        }
    }

    widgetManager.removeWidgets(oldWidgets)

    // widget
    var newWidget = parser.parse([widget.props], widget.parentNode, widget.parent, false, options.reCreateOptions)

    widget.container.parentNode.replaceChild(newWidget.container, widget.container)

    if (newWidget.getProp('type') == 'tab') newWidget.parent.trigger('tab-created', [{widget: widget}])
    if (newWidget.getProp('id') == 'root') DOM.get('.editor-root')[0].setAttribute('data-widget', newWidget.hash)


    resize.check(newWidget.container)


    // restore state
    stateManager.decrementQueue()


    // restore scroll states
    for (let id in wScroll) {
        for (let w of widgetManager.getWidgetById(id)) {
            if (w.scroll) w.scroll(wScroll[id])
        }
    }

    if (wasSelected && !options.preventSelect) {
        editor.select(newWidget)
    }

    sidepanel.scrollTop = scroll


    // return updated node
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
