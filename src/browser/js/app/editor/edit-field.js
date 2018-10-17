var widgetCategories = require('../widgets/').categories,
    {updateWidget} = require('./data-workers'),
    widgetManager = require('../managers/widgets'),
    {deepCopy} = require('../utils'),
    {icon, Popup} = require('../ui/utils'),
    locales = require('../locales')

module.exports = function editField(editor, widget, propName, defaultValue){

    let dynamic = widget.constructor.dynamicProps.includes(propName),
        disabled = widget.disabledProps.indexOf(propName) > -1,
        error = widget.errors[propName]

    let field = DOM.create(`
        <div class="input-wrapper ${widget.errors[propName] ? 'error' : ''} ${disabled ? 'disabled' : ''}" title="${locales('editor_click_for_help')}">
            <label class="btn ${error ? 'error' : ''}">${propName}</label>
        </div>
    `)

    let input

    if (propName !== 'widgets' && propName !== 'tabs') {

        if (propName == 'type') {

            if (widget.props.type == 'tab' || widget.props.type == 'root') {
                field.classList.add('disabled')
                field.appendChild(DOM.create(`<textarea class="input no-keybinding" name="${propName}" rows="1" disabled>${widget.props[propName]}</textarea>`))
                return field
            }

            input = DOM.create('<select class="input no-keybinding"/>')
            var innerHTML = ''

            for (let category in widgetCategories) {
                innerHTML += `<optgroup label="> ${category}">`
                for (let type of widgetCategories[category]) {
                    innerHTML += `<option ${type == widget.props.type ? 'selected' : ''} value="${type}">${type}</option>`
                }
                innerHTML += '</optgroup>'
            }
            input.innerHTML = innerHTML

            var wrapper = DOM.create('<div class="select-wrapper"></div>')
            wrapper.appendChild(input)
            field.appendChild(wrapper)


        } else {

            var value = typeof widget.props[propName] !== 'string' ?
                JSON.stringify(widget.props[propName], null, '  ').replace(/\n\s\s\s\s/g, ' ').replace(/\n\s\s(\}|\])/g, ' $1') : widget.props[propName]

            input = DOM.create(`<textarea class="input no-keybinding" name="${propName}" rows="${value.split('\n').length}">${value}</textarea>`)

            DOM.addEventListener(input, ['input', 'focus'], ()=>{
                input.setAttribute('rows',0)
                input.setAttribute('rows', input.value.split('\n').length)
            })

            input.addEventListener('keydown', (e)=>{
                if (e.keyCode == 13 && !e.shiftKey) {
                    e.preventDefault()
                    DOM.dispatchEvent(input, 'change')
                }
            })

            if (defaultValue.type.includes('boolean')) {

                var toggle = DOM.create(`
                   <span class="checkbox ${widget.props[propName] ? 'on' : ''}">
                       ${icon('check')}
                   </span>
               `)

                toggle.addEventListener('click', ()=>{
                    input.value = !widget.getProp(propName)
                    DOM.dispatchEvent(input, 'change')
                })

                field.appendChild(toggle)

            }

            field.appendChild(input)

        }

        var onChange = ()=>{

            input.removeEventListener('change', onChange)

            var v

            try {
                v = JSON.parseFlex(input.value)
            } catch(err) {
                v = input.value
            }

            var newWidgets = []
            for (var w of editor.selectedWidgets) {
                w.props[propName] = v !== '' ? v : deepCopy(defaultValue.value)
                newWidgets.push(updateWidget(w, {preventSelect: editor.selectedWidgets.length > 1}))
            }
            editor.pushHistory()
            if (newWidgets.length > 1) editor.select(newWidgets)

        }

        input.addEventListener('change', onChange)


    } else if (
        (propName === 'widgets' && (!widget.props.tabs ||! widget.props.tabs.length)) ||
        (propName === 'tabs' && (!widget.props.widgets ||! widget.props.widgets.length))
    ) {

        if (editor.selectedWidgets.length > 1) return

        var list = DOM.create('<ul></ul>')

        for (var i in widget.props[propName]) {

            list.appendChild(DOM.create(`
                <li class="sortables" data-index="${i}">
                    <a class="btn small" data-action="select">${widget.props[propName][i].id}</a>
                    <span data-action="remove"><i class="fa fa-times"></i></span>
                </li>
            `))

        }

        list.appendChild(DOM.create(`
            <li><a class="btn small" data-action="add">${icon('plus')}</a></li>
        `))


        list.addEventListener('click', (e)=>{
            // e.stopPropagation()
            var change
            switch (e.target.getAttribute('data-action')) {

                case 'select':
                    editor.select(widgetManager.getWidgetByElement(DOM.get(propName === 'widgets' ? widget.widget : widget.wrapper, '> .widget')[DOM.index(e.target.closest('li'))]))
                    break

                case 'remove':
                    var index = DOM.index(e.target.closest('li'))
                    widget.props[propName].splice(index,1)
                    updateWidget(widget, {removedIndexes: [index] })
                    editor.pushHistory({removedIndexes: [index] })
                    break

                case 'add':
                    widget.props[propName] = widget.props[propName] || []
                    widget.props[propName].push({})
                    updateWidget(widget, {addedIndexes: [widget.props[propName].length -1] })
                    editor.pushHistory({addedIndexes: [widget.props[propName].length -1] })
                    break

            }

        })

        var $list = $(list)
        $list.sortable({
            items: '.sortables',
            placeholder: 'sortable-placeholder btn small',
            start:function(){$(this).sortable( 'refreshPositions' )},
            update: function(e,ui){
                var oldindex = $(ui.item).attr('data-index')
                var index  = $(ui.item).index()

                widget.props[propName].splice(index, 0, widget.props[propName].splice(oldindex, 1)[0])
                widget.children.splice(index, 0, widget.children.splice(oldindex, 1)[0])
                updateWidget(widget)
                editor.pushHistory()
            }
        })

        input = DOM.create('<div class="input column"></div>')
        input.appendChild(list)
        field.appendChild(input)

    }

    var label = DOM.get(field, 'label')[0]
    label.addEventListener('fast-click', ()=>{

        var htmlHelp = Array.isArray(defaultValue.help) ? defaultValue.help.join('<br/><br/>').replace(/<br\/>-/g, '-') : defaultValue.help
        htmlHelp = htmlHelp ? '<p class="help">' + htmlHelp.replace(/`([^`]*)`/g, '<code>$1</code>') + '</p>' : ''


        var htmlError = error ? `<p class="error">${error}</p>` : ''

        new Popup({closable: true, title: `<span class="editor-help-title">${propName}</span>`, content: `
            <div class="editor-help">

                <p>Type: <code>${defaultValue.type}</code></p>
                <p>Default: <code>${JSON.stringify(defaultValue.value)}</code></p>
                <p>Dynamic: <code>${dynamic ? 'true' : 'false'}</code></p>
                <p>Computed: <code>${widget.cachedProps[propName]}</code></p>

                ${htmlError}

                ${htmlHelp}
            </div>
        `})
    })

    if (input) {
        return field
    }


}
