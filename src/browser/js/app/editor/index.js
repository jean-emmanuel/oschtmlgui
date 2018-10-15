var {widgets} = require('../widgets/'),
    editField = require('./edit-field'),
    {updateWidget, incrementWidget} = require('./data-workers'),
    keyboardJS = require('keyboardjs'),
    diff = require('deep-diff'),
    widgetManager = require('../managers/widgets'),
    {deepCopy} = require('../utils'),
    macOs = (navigator.platform || '').match('Mac'),
    SelectArea = require('./select-area'),
    sessionManager


const HISTORY_SIZE = 50

var Editor = class Editor {

    constructor() {

        this.wrapper = DOM.create(`
            <div class="editor-container">
                <div class="form" id="editor-form">
                </div>
            </div>
        `)

        this.form = DOM.get(this.wrapper, '#editor-form')[0]
        this.form.addEventListener('fast-click', (e)=>{
            if (e.target.classList.contains('separator')) {
                var name = e.target.getAttribute('data-name'),
                    foldedIndex = this.foldedCategories.indexOf(name)
                e.target.parentNode.classList.toggle('folded', foldedIndex < 0)
                if (foldedIndex > -1) {
                    this.foldedCategories.splice(foldedIndex, 1)
                } else {
                    this.foldedCategories.push(name)
                }

            }
        })


        this.defaults = {}
        for (var k in widgets) {
            this.defaults[k] = widgets[k].defaults()
        }

        this.selectedWidgets = []

        this.clipboard = null
        this.idClipboard = null

        this.enabled = false
        this.enabledOnce = false
        window.onbeforeunload = ()=>{
            if (this.enabledOnce) return true
        }


        this.history = []
        this.historyState = -1
        this.historySession = null

        this.foldedCategories = []

        this.mousePosition = {x:0, y:0}
        this.mouveMoveHandler = this.mouseMove.bind(this)

        keyboardJS.withContext('editing', ()=>{
            keyboardJS.bind('mod + z', (e)=>{
                if (e.target.classList.contains('no-keybinding')) return
                this.undo()
            })
            keyboardJS.bind(['mod + y', 'mod + shift + z'], (e)=>{
                if (e.target.classList.contains('no-keybinding')) return
                this.redo()
            })
            keyboardJS.bind('mod + c', (e)=>{
                if (e.target.classList.contains('no-keybinding')) return
                this.copyWidget()
            })
            keyboardJS.bind('mod + x', (e)=>{
                if (e.target.classList.contains('no-keybinding')) return
                this.cutWidget()
            })
            keyboardJS.bind('mod + v', (e)=>{
                if (e.target.classList.contains('no-keybinding')) return
                this.pasteWidget(this.mousePosition.x, this.mousePosition.y, false)
            })
            keyboardJS.bind('mod + shift + v', (e)=>{
                if (e.target.classList.contains('no-keybinding')) return
                this.pasteWidget(this.mousePosition.x, this.mousePosition.y, true)
            })
            keyboardJS.bind(macOs ? 'backspace' : 'delete', (e)=>{
                if (e.target.classList.contains('no-keybinding')) return
                this.deleteWidget()
            })
            keyboardJS.bind(['alt + up', 'alt + down', 'alt + right', 'alt + left'], (e)=>{
                if (e.target.classList.contains('no-keybinding')) return

                var deltaW = e.key === 'ArrowLeft' ? -GRIDWIDTH : e.key === 'ArrowRight' ? GRIDWIDTH : 0,
                    deltaH = e.key === 'ArrowUp' ? -GRIDWIDTH : e.key === 'ArrowDown' ? GRIDWIDTH : 0

                if (e.shiftKey) {
                    deltaW *= 5
                    deltaH *= 5
                }

                this.resizeWidget(deltaW, deltaH)
            })
            keyboardJS.bind(['up', 'down', 'right', 'left'], (e)=>{
                if (e.target.classList.contains('no-keybinding')) return

                var deltaX = e.key === 'ArrowLeft' ? -GRIDWIDTH : e.key === 'ArrowRight' ? GRIDWIDTH : 0,
                    deltaY = e.key === 'ArrowUp' ? -GRIDWIDTH : e.key === 'ArrowDown' ? GRIDWIDTH : 0

                if (e.shiftKey) {
                    deltaX *= 5
                    deltaY *= 5
                }

                this.moveWidget(deltaX, deltaY)
            })
            keyboardJS.bind('mod + shift + a', (e)=>{
                if (e.target.classList.contains('no-keybinding')) return
                this.unselect()
                this.selectedWidgets = []
            })
            keyboardJS.bind('mod + a', (e)=>{
                if (e.target.classList.contains('no-keybinding')) return
                if (!this.selectedWidgets.length) return

                var curWidget = this.selectedWidgets[0],
                    toSelect
                if (curWidget.parent !== widgetManager) {
                    this.select(curWidget.parent.children)
                }
            })
            keyboardJS.bind(['mod + up','mod + down','mod + left' , 'mod + right'], (e)=>{
                if (e.target.classList.contains('no-keybinding')) return
                if (!this.selectedWidgets.length) return

                const curWidget = this.selectedWidgets[0]
                let toSelect = null
                if(e.key == 'ArrowUp' && curWidget.parent!==widgetManager){
                    toSelect = curWidget.parent
                }
                else if(e.key == 'ArrowDown' ){
                    const toSelectList = curWidget.children

                    if(toSelectList && toSelectList.length){
                        toSelectList.sort((a,b)=>a.container.offsetLeft>b.container.offsetLeft)
                        toSelect = toSelectList[0]
                    }

                }
                else if((e.key == 'ArrowLeft') || (e.key == 'ArrowRight')){
                    if (curWidget.parent === widgetManager) return
                    const toSelectList = curWidget.parent.children
                    if(toSelectList && toSelectList.length){
                        toSelectList.sort((a,b)=>a.container.offsetLeft>b.container.offsetLeft)
                        const idx = toSelectList.indexOf(curWidget)
                        if(idx>=0){
                            const nextIdx = (idx + (e.key == 'ArrowLeft'?-1:1)+toSelectList.length) % toSelectList.length
                            toSelect = toSelectList[nextIdx]
                        }
                    }
                }

                if (toSelect) {
                    this.select(toSelect)
                }

            })

            keyboardJS.bind('f2', (e)=>{
                var input = DOM.get(this.form, 'textarea[name="label"]')[0]
                if (input) {
                    var folded = input.closest('.category.folded')
                    if (folded) DOM.dispatchEvent(DOM.get(folded, '.separator'), 'fast-click')
                    input.focus()
                    input.setSelectionRange(0, input.value.length)
                }
            })

        })

        keyboardJS.bind('mod + s', (e)=>{
            e.preventDefault()
            sessionManager.save()
        })

        keyboardJS.bind('mod + e', (e)=>{
            e.preventDefault()
            if (this.enabled) {
                this.disable()
            } else {
                if (sessionManager.session.length) this.enable()
            }
        })


        this.selectarea = new SelectArea('.widget:not(.not-editable), .tablink', (elements)=>{

            elements = elements.map(e => widgetManager.getWidgetByElement(e, ':not(.not-editable)')).filter(e => e)

            for (var i in elements) {
                this.select(elements[i], {multi:true, fromLasso:true})
            }
            this.select(this.selectedWidgets)

        })


    }

    enable() {

        EDITING = true
        this.enabled = true

        this.enabledOnce = true

        DOM.get('.editor-root')[0].setAttribute('data-widget', DOM.get('.root-container')[0].getAttribute('data-widget'))
        DOM.get('.editor-root')[0].classList.remove('disabled')
        DOM.get('.disable-editor')[0].classList.remove('on')
        DOM.get('.enable-editor')[0].classList.add('on')
        document.body.classList.add('editor-enabled')
        document.body.classList.toggle('no-grid', GRIDWIDTH == 1)


        GRIDWIDTH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--grid-width'))

        var gridForm = DOM.create(`
            <div class="form" id="grid-width-form">
                <div class="separator"><span>Grid</span></div>
                <div class="input-wrapper">
                    <label>Width</label>
                    <input class="input no-keybinding" type="number" id="grid-width-input" step="1" min="1" max="100" value="${GRIDWIDTH}"/>
                </div>
            </div>
        `)

        DOM.each(gridForm, '#grid-width-input', (input)=>{
            DOM.addEventListener(input, 'keyup mouseup change mousewheel', (e)=>{
                setTimeout(()=>{
                    var v = Math.max(Math.min(parseInt(input.value), 100), 1)
                    if (isNaN(v)) return
                    input.value = v
                    GRIDWIDTH = v
                    document.body.classList.toggle('no-grid', GRIDWIDTH == 1)
                    document.documentElement.style.setProperty('--grid-width', GRIDWIDTH)
                })
            })
        })

        DOM.get(document, '.editor-menu')[0].appendChild(gridForm)

        keyboardJS.setContext('editing')

        document.body.addEventListener('mousemove', this.mouveMoveHandler)

        this.selectarea.enable()

    }

    disable() {

        EDITING = false
        this.enabled = false

        if (READ_ONLY) {
            this.enable = ()=>{}
            $('.editor-menu .btn').remove()
            $('.editor-menu .title').html($('.editor-menu .title').html() + ' (disabled)').addClass('disabled')
            return
        }

        this.unselect()
        this.selectedWidgets = []
        DOM.get('.editor-root')[0].classList.add('disabled')
        DOM.get('.disable-editor')[0].classList.add('on')
        DOM.get('.enable-editor')[0].classList.remove('on')
        document.body.classList.remove('editor-enabled')

        var gridForm = DOM.get('#grid-width-form')[0]
        if (gridForm) gridForm.parentNode.removeChild(gridForm)

        keyboardJS.setContext('global')

        document.body.removeEventListener('mousemove', this.mouveMoveHandler)

        this.selectarea.disable()

    }

    unselect() {

        DOM.get('#editor')[0].innerHTML = ''

        this.form.innerHTML = ''

        DOM.each(document, '.editing', (element)=>{
            element.classList.remove('editing')
        })

        $('.widget.ui-resizable').resizable('destroy')
        $('.widget.ui-draggable').draggable('destroy').find('.ui-draggable-handle').remove()

    }

    select(widget, options={}){
        if(this.selectedWidgets){
            for(var o of this.selectedWidgets){
                o.off('prop-changed.editor')
            }
        }
        if (!options.fromLasso) this.unselect()

        if (Array.isArray(widget)) {

            this.selectedWidgets = widget

        } else if (options.multi) {

            var sameLevel = false

            while (!sameLevel && widget.parent !== widgetManager) {
                let test = true
                for (var w of this.selectedWidgets) {
                    if (w.parent !== widget.parent) test = false
                }
                sameLevel = test
                if (!sameLevel) widget = widget.parent
            }

            if (!this.selectedWidgets.includes(widget) && sameLevel) {

                this.selectedWidgets.push(widget)

            } else if (sameLevel && !options.fromLasso){

                this.selectedWidgets.splice(this.selectedWidgets.indexOf(widget), 1)

            }

        } else {

            if (!options.refresh && (widget.container.classList.contains('editing'))) return

            this.selectedWidgets = [widget]


        }

        if (this.selectedWidgets.length > 0 && !options.fromLasso) {

            this.createEditForm()
            this.createSelectionBlock()

        }

    }


    createEditForm(){

        var widget = this.selectedWidgets[0],
            props = this.defaults[widget.props.type]

        this.form.appendChild(DOM.create(`
            <div class="separator">
                ${this.selectedWidgets.length > 1 ? '<span class="accent">Multiple Widgets</span>' : '<span>Widget</span>' }
            </div>
        `))

        let category

        for (let propName in props) {

            let field,
                shared = true

            for (var w of this.selectedWidgets) {
                if (this.defaults[w.props.type][propName] === undefined) {
                    shared = false
                }
            }

            if (!shared) continue

            if (propName.indexOf('_') === 0 && propName !== '_props') {

                if (category) this.form.appendChild(category)
                category = DOM.create(`<div class="category ${this.foldedCategories.indexOf(props[propName]) > -1 ? 'folded' : ''}"></div>`)

                field = DOM.create(`<div class="separator" data-name="${props[propName]}"><span>${props[propName]}</span></div>`)

            } else if (widget.props[propName] === undefined) {

                continue

            } else {

                field = editField(this, widget, propName, props[propName])
                if (!field) continue

            }

            if (category) {
                category.appendChild(field)
            } else {
                this.form.appendChild(field)
            }

        }

        if (category) this.form.appendChild(category)

        this.wrapper.appendChild(this.form)
        DOM.get('#editor')[0].appendChild(this.wrapper)

    }

    createSelectionBlock(){

        DOM.each(document, '.editing', (element)=>{
            element.classList.remove('editing')
        })

        for (let widget of this.selectedWidgets) {
            DOM.each(document, `[data-widget="${widget.hash}"]`, (item)=>{
                item.classList.add('editing')
            })
        }

        var widget = this.selectedWidgets[0]

        if (widget.props.height !== undefined || widget.props.width !== undefined) {

            let $container = $(widget.container)
            $container.resizable({
                handles: 's, e, se',
                helper: 'ui-helper',
                resize: (event, ui)=>{
                    ui.size.height = Math.round(ui.size.height / (GRIDWIDTH * PXSCALE)) * GRIDWIDTH * PXSCALE
                    ui.size.width = Math.round(ui.size.width / (GRIDWIDTH * PXSCALE)) * GRIDWIDTH * PXSCALE
                },
                stop: (event, ui)=>{

                    var deltaH = ui.size.height - ui.originalSize.height,
                        deltaW = ui.size.width - ui.originalSize.width

                    this.resizeWidget(deltaW, deltaH, ui)

                },
                grid: [GRIDWIDTH * PXSCALE, GRIDWIDTH * PXSCALE]
            })

        }

        if (widget.props.top !== undefined) {
            let $container = $(widget.container)
            $container.draggable({
                cursor:'-webkit-grabbing',
                drag: (event, ui)=>{
                    ui.position.top = Math.round(ui.position.top / (GRIDWIDTH * PXSCALE)) * GRIDWIDTH * PXSCALE
                    ui.position.left = Math.round(ui.position.left / (GRIDWIDTH * PXSCALE)) * GRIDWIDTH * PXSCALE
                },
                stop: (event, ui)=>{
                    event.preventDefault()

                    var deltaX = (ui.helper.position().left + $container.parent().scrollLeft()) / PXSCALE - widget.container.offsetLeft / PXSCALE,
                        deltaY = (ui.helper.position().top + $container.parent().scrollTop()) / PXSCALE - widget.container.offsetTop / PXSCALE

                    this.moveWidget(deltaX, deltaY)

                    ui.helper.remove()
                },
                handle:'.ui-draggable-handle, > .label',
                grid: [GRIDWIDTH * PXSCALE, GRIDWIDTH * PXSCALE],
                helper:()=>{
                    return $('<div class="ui-helper"></div>').css({height:$container.outerHeight(),width:$container.outerWidth()})
                }
            }).append('<div class="ui-draggable-handle"></div>')

        }


    }

    mouseMove(e) {

        this.mousePosition.x = Math.round((e.offsetX + e.target.scrollLeft) / (GRIDWIDTH * PXSCALE)) * GRIDWIDTH,
        this.mousePosition.y = Math.round((e.offsetY + e.target.scrollTop)  / (GRIDWIDTH * PXSCALE)) * GRIDWIDTH

    }

    copyWidget() {

        if (!this.selectedWidgets.length) return

        var data = this.selectedWidgets.map((w)=>w.props),
            type = this.selectedWidgets[0].props.type == 'tab' ? 'tab' : 'widget'


        if (type !== 'widget') return

        this.clipboard = JSON.stringify(data)

        if (data.length == 1) {
            this.idClipboard = this.selectedWidgets[0].getProp('id')
        } else {
            this.idClipboard =null
        }

    }

    cutWidget() {

        if (!this.selectedWidgets.length) return

        var index = this.selectedWidgets.map((w)=>DOM.index(w.container)).sort((a,b)=>{return b-a}),
            data = this.selectedWidgets.map((w)=>w.props),
            type = this.selectedWidgets[0].props.type == 'tab' ? 'tab' : 'widget',
            parent = this.selectedWidgets[0].parent

        if (type !== 'widget') return

        this.clipboard = JSON.stringify(data)

        if (data.length == 1) {
            this.idClipboard = this.selectedWidgets[0].getProp('id')
        } else {
            this.idClipboard =null
        }

        for (var i of index) {
            parent.props.widgets.splice(i,1)
        }

        this.select(updateWidget(parent, {preventSelect: true}))
        this.pushHistory()

    }

    pasteWidget(x, y, increment) {

        if (!this.selectedWidgets.length || this.clipboard === null) return

        var data = this.selectedWidgets.map((w)=>w.props)

        var pastedData = JSON.parse(this.clipboard),
            minTop = Infinity,
            minLeft = Infinity

        for (var i in pastedData) {
            if (increment) pastedData[i] = incrementWidget(pastedData[i])
            if (!isNaN(pastedData[i]).top && pastedData[i].top < minTop) {
                minTop = pastedData[i].top
            }
            if (!isNaN(pastedData[i]).left && pastedData[i].left < minLeft) {
                minLeft = pastedData[i].left
            }
        }

        for (let i in pastedData) {

            if (!isNaN(pastedData[i].left)) pastedData[i].left = pastedData[i].left - minLeft + x
            if (!isNaN(pastedData[i].top)) pastedData[i].top  = pastedData[i].top - minTop + y

        }

        data[0].widgets = data[0].widgets || []
        data[0].widgets = data[0].widgets.concat(pastedData)

        updateWidget(this.selectedWidgets[0])
        this.pushHistory()

    }

    pasteWidgetAsClone(x, y) {

        if (!this.selectedWidgets.length) return

        if (this.clipboard === null || !(this.idClipboard && widgetManager.getWidgetById(this.idClipboard).length)) return

        var data = this.selectedWidgets.map((w)=>w.props)

        var clone = {type: 'clone', widgetId: this.idClipboard},
            pastedData = JSON.parse(this.clipboard)

        clone.width = pastedData.width
        clone.height = pastedData.width
        clone.css = pastedData.css


        clone.left = x
        clone.top  = y

        data[0].widgets = data[0].widgets || []
        data[0].widgets.push(clone)

        updateWidget(this.selectedWidgets[0])
        this.pushHistory()

    }


    deleteWidget() {

        if (!this.selectedWidgets.length) return

        var index = this.selectedWidgets.map((w)=>DOM.index(w.container)).sort((a,b)=>{return b-a}),
            type = this.selectedWidgets[0].props.type == 'tab' ? 'tab' : 'widget',
            parent = this.selectedWidgets[0].parent

        if (this.selectedWidgets[0].getProp('id') === 'root') return

        if (type === 'widget') {
            for (let i of index) {
                parent.props.widgets.splice(i,1)
            }
        } else {
            for (let i of index) {
                parent.props.tabs.splice(i,1)
            }
        }

        this.select(updateWidget(parent, {preventSelect: true}))
        this.pushHistory()

    }

    resizeWidget(deltaW, deltaH, ui) {

        if (!this.selectedWidgets.length) return

        var newWidgets = []

        for (var i = 0; i < this.selectedWidgets.length; i++) {

            let w = this.selectedWidgets[i],
                nW, nH

            if (i === 0 && ui) {
                nW = ui.originalSize.width + deltaW
                nH = ui.originalSize.height + deltaH

            } else {
                nW = w.container.offsetWidth + deltaW
                nH = w.container.offsetHeight + deltaH
            }

            if (w.props.width !== undefined) {
                var newWidth = Math.max(nW, GRIDWIDTH) / PXSCALE
                if (typeof w.props.width === 'string' && w.props.width.indexOf('%') > -1) {
                    newWidth = (100 * PXSCALE * newWidth / w.container.parentNode.offsetWidth).toFixed(2) + '%'
                }
                w.setProp('width',newWidth,'resize')

            }

            if (w.props.height !== undefined) {
                var newHeight = Math.max(nH, GRIDWIDTH) / PXSCALE
                if (typeof w.props.height === 'string' && w.props.height.indexOf('%') > -1) {
                    newHeight = (100 * PXSCALE * newHeight / w.container.parentNode.offsetHeight).toFixed(2) + '%'
                }
                w.setProp('height',newHeight,'resize')
            }
            w.applyPropChanges('resize')

            if (w.props.width !== undefined || w.props.height !== undefined) 
                newWidgets.push(w)

        }

        this.pushHistory()

        if (newWidgets.length > 1) this.select(newWidgets, {preventSelect: this.selectedWidgets.length > 1})

    }

    moveWidget(deltaX, deltaY) {

        if (!this.selectedWidgets.length) return

        var newWidgets = []

        for (var w of this.selectedWidgets) {

            var newTop = w.container.offsetTop / PXSCALE + deltaY
            if (typeof w.props.top === 'string' && w.props.top.indexOf('%') > -1) {
                w.setProp('top',(100 * PXSCALE * newTop / w.container.parentNode.offsetHeight).toFixed(2) + '%','move')
            } else {
                w.setProp('top', newTop,'move')
            }
            var newLeft = w.container.offsetLeft / PXSCALE + deltaX
            if (typeof w.props.left === 'string' && w.props.left.indexOf('%') > -1) {
                w.setProp('left', (100 * PXSCALE * newLeft / w.container.parentNode.offsetWidth).toFixed(2) + '%','move')
            } else {
                w.setProp('left', newLeft,'move')
            }

            w.applyPropChanges('move')

            newWidgets.push(w)

        }

        this.pushHistory()

        // if (newWidgets.length > 1) this.select(newWidgets)

    }



    pushHistory() {

        if (this.historyState > -1) {
            this.history.splice(0, this.historyState + 1)
            this.historyState = -1
        }

        var d = diff.diff(this.historySession, sessionManager.session)

        if (d) {
            for (var c of deepCopy(d)) {
                diff.applyChange(this.historySession, null, c)
            }
            this.history.unshift(deepCopy(d))
            if (this.history.length > HISTORY_SIZE) this.history.pop()
        }

    }

    clearHistory() {

        this.history = []
        this.historyState = -1
        this.historySession = deepCopy(sessionManager.session)

    }

    undo() {

        if (this.historyState === this.history.length - 1) return

        this.historyState += 1

        var d1 = deepCopy(this.history[this.historyState]),
            d2 = deepCopy(this.history[this.historyState]),
            path

        for (var i = d1.length - 1; i > -1; i--) {
            diff.revertChange(this.historySession, true, d1[i])
            diff.revertChange(sessionManager.session, true, d2[i])
            if (!path || path.length > d1[i].path.length) path = d1[i].path
        }

        if (d1.length > 1) {
            // path intersection
            var stop, j, k, n
            for (j = 0; j < path.length; j++) {
                for (k = 0; k < d1.length; k++) {
                    if (d1[k].path[j] !== path[j]) {
                        stop = true
                        break
                    }
                }
                if (stop) break
            }
            n = stop ? j : j - 1
            path.splice(n, path.length - n)
        }


        this.updateWidgetByPath(path)

    }

    redo() {

        if (this.historyState === -1) return

        var d1 = deepCopy(this.history[this.historyState]),
            d2 = deepCopy(this.history[this.historyState]),
            path

        for (var i = 0; i < d1.length; i++) {
            diff.applyChange(this.historySession, true, d1[i])
            diff.applyChange(sessionManager.session, true, d2[i])
            if (!path || path.length > d1[i].path.length) path = d1[i].path
        }

        if (d1.length > 1) {
            // path intersection
            var stop, j, k, n
            for (j = 0; j < path.length; j++) {
                for (k = 0; k < d1.length; k++) {
                    if (d1[k].path[j] !== path[j]) {
                        stop = true
                        break
                    }
                }
                if (stop) break
            }
            n = stop ? j : j - 1
            path.splice(n, path.length - n)
        }

        this.updateWidgetByPath(path)

        this.historyState -= 1

    }

    updateWidgetByPath(path) {

        var req = '.root-container'
        for (var j = 1; j < path.length; j++) {
            var item = path[j]
            if (item === 'widgets' && j + 1 < path.length) {
                req += ' > .panel'
            } else if (item === 'tabs' && j + 1 < path.length) {
                req += ' > .panel > .tabs-wrapper'
            } else if (!isNaN(item)) {
                req += ' > .widget:nth-child(' + (item + 1) + ')'
            } else {
                break
            }
        }

        var e = DOM.get(req),
            w

        if (e.length) {
            w = widgetManager.getWidgetByElement(e[0])
        } else {
            // in case the elements are in a hidden tab (detached dom)
            w = widgetManager.getWidgetById('root')[0]
        }

        updateWidget(w)

    }




}

var editor = new Editor()

module.exports = editor

require('./context-menu')
sessionManager = require('../managers/session')
