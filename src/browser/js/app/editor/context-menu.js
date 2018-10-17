var {updateWidget} = require('./data-workers'),
    {categories} = require('../widgets/'),
    widgetManager = require('../managers/widgets'),
    editor = require('./'),
    locales = require('../locales')


var multiSelectKey = (navigator.platform || '').match('Mac') ? 'metaKey' : 'ctrlKey'


class ContextMenu {

    constructor(){

        this.menu = null
        this.event = 'fast-click'
        this.root = document.body

    }

    open(e, actions, parent) {

        var menu = DOM.create('<div class="context-menu"></div>')

        for (let label in actions) {

            if (typeof actions[label] == 'object') {

                let item = DOM.create(`<div class="item has-sub" tabIndex="1">${label}</div>`)
                menu.appendChild(item)

                this.open(e,actions[label],item)


            } else {

                let item = DOM.create(`<div class="item">${label}</div>`)
                menu.appendChild(item)
                item.addEventListener(this.event, (e)=>{
                    e.detail.preventOriginalEvent = true
                    actions[label]()
                    this.close()
                })

            }

        }

        if (parent) parent.appendChild(menu)

        if (!parent) {

            this.menu = menu

            this.root.appendChild(menu)

            DOM.each(menu, '.item', (item)=>{
                item.addEventListener('mouseenter', ()=>{
                    DOM.each(item.parentNode, '.focus', (focused)=>{
                        focused.classList.remove('focus')
                    })
                    item.classList.add('focus')
                })
                item.addEventListener('mouseleave', ()=>{
                    if (!item.classList.contains('has-sub')) item.classList.remove('focus')
                })
            })

            menu.style.top = e.pageY + 'px'
            menu.style.left = e.pageX + 'px'

            this.correctPosition(menu)

            DOM.each(menu, '.context-menu', (m)=>{
                this.correctPosition(m, m.parentNode)
            })

        }


    }

    close() {

        if (this.menu) {

            this.menu.parentNode.removeChild(this.menu)
            this.menu = null

        }

    }

    correctPosition(menu, parent) {

        var position = DOM.offset(menu),
            width = menu.offsetWidth,
            height = menu.offsetHeight,
            totalWidth = this.root.offsetWidth,
            totalHeight = this.root.offsetHeight

        if (width + position.left > totalWidth) {
            menu.style.right = parent ? '100%' : '0'
            menu.style.left = 'auto'
            menu.style.marginRight = '2rem'
        }

        if (height + position.top > totalHeight) {
            menu.style.top = 'auto'
            menu.style.bottom = '2rem'
        }

    }

}

var contextMenu = new ContextMenu()

var handleClick = function(event) {

    if (!EDITING) return

    if (contextMenu.menu && !contextMenu.menu.contains(event.target)) contextMenu.close()

    if (!event.detail[multiSelectKey] && event.type !== 'fast-right-click' && (
        event.target.classList.contains('ui-resizable-handle') ||
        event.target.classList.contains('ui-draggable-handle') ||
        event.target.id === 'open-toggle'
    )) { return }

    var eventData = event.detail,
        widget = widgetManager.getWidgetByElement(eventData.target, ':not(.not-editable)')

    if (!widget) return

    // if the widget is not already selected
    if (!widget.container.classList.contains('editing')) {
        // add a flag to the original event to prevent draginit
        // and prevent any further fast-click (ie input focus)
        eventData.capturedByEditor = true
        event.capturedByEditor = true
    }


    if (event.type !== 'fast-right-click') {
        editor.select(widget, {multi: event.detail[multiSelectKey]})
    }

    // right-click menu
    if (event.type !== 'fast-right-click') return

    if (!event.detail.shiftKey && !event.detail[multiSelectKey] && editor.selectedWidgets.length <= 1) {
        editor.select(widget)
    }

    if (!editor.selectedWidgets.length) return

    var index = editor.selectedWidgets.map((w)=>DOM.index(w.container)).sort((a,b)=>{return b-a}),
        data = editor.selectedWidgets.map((w)=>w.props),
        type = editor.selectedWidgets[0].props.type == 'tab' ? 'tab' : 'widget',
        parent = editor.selectedWidgets[0].parent,
        actions = {}

    // case root: only "add tab" option
    if (parent === widgetManager) {
        actions['<i class="fa fa-plus"></i> ' + locales('editor_addtab')] = ()=>{
            data[0].tabs.push({})

            var indexes = {addedIndexes: [data[0].tabs.length -1]}
            updateWidget(widget, indexes)
            editor.pushHistory(indexes)
        }
        contextMenu.open(eventData, actions)

        return
    }

    // case !root

    var clickX = Math.round((eventData.offsetX + eventData.target.scrollLeft) / (GRIDWIDTH * PXSCALE)) * GRIDWIDTH,
        clickY = Math.round((eventData.offsetY + eventData.target.scrollTop)  / (GRIDWIDTH * PXSCALE)) * GRIDWIDTH

    actions['<i class="fa fa-expand"></i> ' + locales('editor_editparent')] = ()=>{
        editor.select(parent)
    }

    if (type === 'widget')  {

        actions['<i class="fa fa-copy"></i> ' + locales('editor_copy')] = editor.copyWidget.bind(editor)

        actions['<i class="fa fa-cut"></i> ' + locales('editor_cut')] = editor.cutWidget.bind(editor)

        actions['<i class="fa fa-box"></i> ' + locales('editor_wrap')] = {}
        for (let c of categories.Containers) {
            if (c === 'clone') continue
            actions['<i class="fa fa-box"></i> ' + locales('editor_wrap')][c] = ()=>{
                var wrap =  {type: c, widgets:[], label: c === 'modal' ? 'auto' : false}

                wrap.widgets = data

                var minTop = Math.min(...data.map(x=>isNaN(x.top) ? x.top == 'auto' ? 0 : Infinity : x.top))
                var minLeft = Math.min(...data.map(x=>isNaN(x.left) ? x.left == 'auto' ? 0 : Infinity : x.left))

                wrap.top = minTop === Infinity ? data[0].top : minTop
                wrap.left= minLeft === Infinity ? data[0].left : minLeft

                for (var w of wrap.widgets) {
                    if (!isNaN(w.top)) w.top = Math.max(w.top - minTop, 0)
                    if (!isNaN(w.left)) w.left = Math.max(w.left - minLeft, 0)
                }

                var i
                for (i of index) {
                    parent.props.widgets.splice(i,1)
                }

                parent.props.widgets = parent.props.widgets.slice(0, i).concat(wrap, parent.props.widgets.slice(i, parent.props.widgets.length))

                editor.select(updateWidget(parent, {preventSelect: true, removedIndexes: index, addedIndexes: [i]}))
                editor.pushHistory({removedIndexes: index, addedIndexes: [i]})

            }
        }

    }


    if (data.length == 1 && (!data[0].tabs || !data[0].tabs.length) && (data[0].widgets)) {

        if (editor.clipboard !== null) {

            let paste = actions['<i class="fa fa-paste"></i> ' + locales('editor_paste')] = {}

            paste['<i class="fa fa-paste"></i> ' + locales('editor_paste')] = ()=>{
                editor.pasteWidget(clickX, clickY)
            }

            paste['<i class="fa fa-plus-square"></i> ' + locales('editor_pasteindent')] = ()=>{
                editor.pasteWidget(clickX, clickY, true)
            }

            if (editor.idClipboard && widgetManager.getWidgetById(editor.idClipboard).length) {
                paste['<i class="fa fa-clone"></i> ' + locales('editor_clone')] = ()=>{
                    editor.pasteWidgetAsClone(clickX, clickY)
                }
            }

        }

        actions['<i class="fa fa-plus"></i> ' + locales('editor_addwidget')] = {}

        for (let category in categories) {

            actions['<i class="fa fa-plus"></i> ' + locales('editor_addwidget')][category] = {}

            for (let t in categories[category]) {

                let type = categories[category][t]

                actions['<i class="fa fa-plus"></i> ' + locales('editor_addwidget')][category][type] = ()=>{

                    var newData = {type: type}

                    if (!eventData.target.classList.contains('tablink')) {
                        newData.top = clickY
                        newData.left= clickX
                    }

                    data[0].widgets = data[0].widgets || []
                    data[0].widgets.push(newData)

                    var indexes = {addedIndexes: [data[0].widgets.length -1]}
                    updateWidget(editor.selectedWidgets[0], indexes)
                    editor.pushHistory(indexes)

                }

            }

        }

    }

    if (data.length == 1 && (!data[0].widgets || !data[0].widgets.length) && (data[0].tabs)) {

        actions['<i class="fa fa-plus"></i> ' + locales('editor_addtab')] = ()=>{
            data[0].tabs = data[0].tabs || []
            data[0].tabs.push({})

            var indexes = {addedIndexes: [data[0].tabs.length -1]}
            updateWidget(editor.selectedWidgets[0], indexes)
            editor.pushHistory(indexes)

        }

    }

    actions['<i class="fa fa-trash"></i> ' + locales('editor_delete')] = editor.deleteWidget.bind(editor)

    contextMenu.open(eventData, actions)

}

document.addEventListener('fast-right-click', handleClick, true)
document.addEventListener('fast-click', handleClick, true)
