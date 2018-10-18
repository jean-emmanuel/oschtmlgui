var {widgets} = require('../widgets/'),
    editField = require('./edit-field'),
    {updateWidget, incrementWidget} = require('./data-workers'),
    keyboardJS = require('keyboardjs'),
    diff = require('jsondiffpatch'),
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
                if (!this.selectedWidgets.length) return
                if (e.target.classList.contains('no-keybinding')) return
                this.unselect()
                this.selectedWidgets = []
            })
            keyboardJS.bind('mod + a', (e)=>{
                if (!this.selectedWidgets.length) return
                if (e.target.classList.contains('no-keybinding')) return

                var curWidget = this.selectedWidgets[0],
                    toSelect
                if (curWidget.parent !== widgetManager) {
                    this.select(curWidget.parent.children)
                }
            })
            keyboardJS.bind(['mod + up','mod + down','mod + left' , 'mod + right'], (e)=>{

                if (!this.selectedWidgets.length) return
                if (e.target.classList.contains('no-keybinding')) return

                var curWidget = this.selectedWidgets[0],
                    toSelect = null

                if (e.key === 'ArrowUp' && curWidget.parent !== widgetManager) {

                    toSelect = curWidget.parent

                } else if (e.key === 'ArrowDown') {

                    var toSelectList = [...curWidget.children]

                    if (toSelectList && toSelectList.length) {
                        toSelectList.sort((a,b) => a.container.offsetLeft>b.container.offsetLeft)
                        toSelect = toSelectList[0]
                        if (toSelect.container.classList.contains('not-editable')) {
                            toSelect = null
                        }
                    }

                }
                else if((e.key == 'ArrowLeft') || (e.key == 'ArrowRight')){
                    if (curWidget.parent === widgetManager) return
                    var toSelectList = [...curWidget.parent.children]
                    if (toSelectList && toSelectList.length) {
                        toSelectList.sort((a,b) => a.container.offsetLeft > b.container.offsetLeft)
                        var idx = toSelectList.indexOf(curWidget)
                        if (idx >= 0) {
                            var nextIdx = (idx + (e.key === 'ArrowLeft' ? -1 : 1 ) + toSelectList.length) % toSelectList.length
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

        var type = this.selectedWidgets[0].props.type == 'tab' ? 'tab' : 'widget',
            parent = this.selectedWidgets[0].parent,
            index = this.selectedWidgets.map(w => parent.children.indexOf(w)).sort((a,b)=>{return b-a}),
            data = this.selectedWidgets.map((w)=>w.props),
            removedIndexes = []

        if (type !== 'widget') return

        this.clipboard = JSON.stringify(data)

        if (data.length == 1) {
            this.idClipboard = this.selectedWidgets[0].getProp('id')
        } else {
            this.idClipboard =null
        }

        for (var i of index) {
            removedIndexes.push(i)
            parent.props.widgets.splice(i,1)
        }

        this.select(updateWidget(parent, {
            preventSelect: true,
            removedIndexes
        }))
        this.pushHistory({removedIndexes})

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

        var indexes = {addedIndexes: []}
        for (var i = 0; i < pastedData.length; i++) {
            indexes.addedIndexes.push(data[0].widgets.length - 1 - i )
        }
        updateWidget(this.selectedWidgets[0], indexes)
        this.pushHistory(indexes)

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

        var indexes = {addedIndexes: [data[0].widgets.length -1]}
        updateWidget(this.selectedWidgets[0], indexes)
        this.pushHistory(indexes)

    }


    deleteWidget() {

        if (!this.selectedWidgets.length) return

        var type = this.selectedWidgets[0].props.type == 'tab' ? 'tab' : 'widget',
            parent = this.selectedWidgets[0].parent,
            index = this.selectedWidgets.map(w => parent.children.indexOf(w)).sort((a,b)=>{return b-a}),
            removedIndexes = []

        if (this.selectedWidgets[0].getProp('id') === 'root') return

        if (type === 'widget') {
            for (let i of index) {
                removedIndexes.push(i)
                parent.props.widgets.splice(i,1)
            }
        } else {
            for (let i of index) {
                removedIndexes.push(i)
                parent.props.tabs.splice(i,1)
            }
        }

        this.select(updateWidget(parent, {
            preventSelect: true,
            removedIndexes
        }))
        this.pushHistory({removedIndexes})

    }

    resizeWidget(deltaW, deltaH, ui) {

        if (!this.selectedWidgets.length) return

        var newWidgets = []
        
        for (var i = 0; i < this.selectedWidgets.length; i++) {
            
            let w = this.selectedWidgets[i],
                nW, nH
            w.startPropChangeSet('resize',{fromEditor:true})
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
                w.setProp('width',newWidth)

            }

            if (w.props.height !== undefined) {
                var newHeight = Math.max(nH, GRIDWIDTH) / PXSCALE
                if (typeof w.props.height === 'string' && w.props.height.indexOf('%') > -1) {
                    newHeight = (100 * PXSCALE * newHeight / w.container.parentNode.offsetHeight).toFixed(2) + '%'
                }
                w.setProp('height',newHeight)
            }
            w.applyPropChangeSet()//'resize'

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

            w.startPropChangeSet('move',{fromEditor:true})
            
            var newTop = w.container.offsetTop / PXSCALE + deltaY
            if (typeof w.props.top === 'string' && w.props.top.indexOf('%') > -1) {
                newtop = (100 * PXSCALE * newTop / w.container.parentNode.offsetHeight).toFixed(2) + '%'
            } 
            w.setProp('top', newTop)
            
            var newLeft = w.container.offsetLeft / PXSCALE + deltaX
            if (typeof w.props.left === 'string' && w.props.left.indexOf('%') > -1) {
                newLeft =  (100 * PXSCALE * newLeft / w.container.parentNode.offsetWidth).toFixed(2) + '%'
            }
            w.setProp('left', newLeft)
            

            w.applyPropChangeSet()//'move'

            newWidgets.push(w)

        }

        this.pushHistory()

        if (newWidgets.length > 1) this.select(newWidgets)

    }



    pushHistory(indexes) {

        if (this.historyState > -1) {
            this.history.splice(0, this.historyState + 1)
            this.historyState = -1
        }

        var d = diff.diff(this.historySession, sessionManager.session)

        if (d) {
            diff.patch(this.historySession, deepCopy(d))
            this.history.unshift([deepCopy(d), indexes])
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

        var [patch, indexes] = this.history[this.historyState],
            d1 = deepCopy(patch),
            d2 = deepCopy(patch)

        diff.unpatch(this.historySession, d1)
        diff.unpatch(sessionManager.session, d2)

        this.updateWidgetFromPatch(patch, indexes ? {
            addedIndexes: deepCopy(indexes.removedIndexes),
            removedIndexes: deepCopy(indexes.addedIndexes),
        } : undefined)

    }

    redo() {

        if (this.historyState === -1) return

        var [patch, indexes] = this.history[this.historyState],
            d1 = deepCopy(patch),
            d2 = deepCopy(patch)

        diff.patch(this.historySession, d1)
        diff.patch(sessionManager.session, d2)

        this.updateWidgetFromPatch(patch, indexes ? {
            addedIndexes: deepCopy(indexes.addedIndexes),
            removedIndexes: deepCopy(indexes.removedIndexes),
        } : undefined)

        this.historyState -= 1

    }

    updateWidgetFromPatch(patch, indexes) {

        // get object path from patch
        var pointer = patch[0],
            path = []

        while(true) {

            var keys = Object.keys(pointer),
                potentialPointers = keys.filter(x => !isNaN(x) || x === 'tabs' || x === 'widgets')

            if (
                keys.filter(x => typeof x === 'string' && x.match(/_[0-9]+/)).length ||
                potentialPointers.length !== 1
            ) {
                break
            }

            path.push(potentialPointers[0])
            pointer = pointer[potentialPointers[0]]

        }

        if (!isNaN(path[path.length - 1]) && !isNaN(path[path.length - 2])) {
            path.pop()
            path.pop()
        }

        // get widget from path
        var widget = widgetManager.getWidgetById('root')[0]
        pointer = patch[0]
        for (var i in path) {
            if (!isNaN(path[i])) widget = widget.children[parseInt(path[i])]
            pointer = pointer[path[i]]
        }

        updateWidget(widget, indexes || {reuseChildren: false})

    }




}

var editor = new Editor()

module.exports = editor

require('./context-menu')
sessionManager = require('../managers/session')
