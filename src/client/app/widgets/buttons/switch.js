var Widget = require('../common/widget'),
    {iconify} = require('../../ui/utils'),
    html = require('nanohtml')

module.exports = class Switch extends Widget {

    static defaults() {

        return super.defaults({

            _switch:'switch',

            horizontal: {type: 'boolean', value: false, help: 'Set to `true` to display values horizontally'},
            showValues: {type: 'boolean', value: false, help: 'If values is an object, set to `true` to display both values and labels instead of labels only'},
            values: {type: 'array|object', value: {'Value 1':1,'Value 2':2}, help: [
                '`Array` of possible values to switch between : `[1,2,3]`',
                '`Object` of `"label":value` pairs. Numeric labels must be prepended or appended with a white space (or any other non-numeric character) otherwise the order of the values won\'t be kept',
            ]}

        })

    }

    constructor(options) {

        super({...options, html: html`<div class="switch"></div>`})


        if (this.getProp('horizontal')) this.widget.classList.add('horizontal')

        this.values = []
        this.stringValues = []

        var values =  this.getProp('values')

        if (!Array.isArray(values) && !(typeof values === 'object' && values !== null)) {
            values = [values]
        }

        var isArray = Array.isArray(values)

        for (var k in values) {

            this.values.push(values[k])

            if (typeof values[k] == 'object') {
                this.stringValues.push(JSON.stringify(values[k]))
            } else {
                this.stringValues.push(0)
            }

            var label = isArray ? values[k]: k
            if (this.getProp('showValues') && !isArray) label = label + ': ' + (this.stringValues[this.stringValues.length - 1] || values[k])

            this.widget.appendChild(html`
                <div class="value"> ${iconify(label)}</div>
            `)

        }

        this.value = undefined

        this.on('draginit', (e)=>{

            var index = 0,
                node = e.target

            while ( (node = node.previousSibling) ) {
                if (node.nodeType != 3) {
                    index++
                }
            }

            var value = this.values[index]

            if (value!=this.value || this.value===undefined) this.setValue(value,{sync:true,send:true})

        }, false, {element: this.widget})

    }

    setValue(v, options={}) {

        var i = typeof v == 'object' ?
            this.stringValues.indexOf(JSON.stringify(v)) :
            this.values.indexOf(v)

        DOM.each(this.widget, '.on', (el)=>{el.classList.remove('on')})

        if (i!=-1) {
            this.value = this.values[i]
            DOM.get(this.widget, '.value')[i].classList.add('on')
            if (options.send) this.sendValue(this.value)
            if (options.sync) this.changed(options)
        } else {
            this.value = undefined
            if (options.sync) this.changed(options)
        }

    }}
