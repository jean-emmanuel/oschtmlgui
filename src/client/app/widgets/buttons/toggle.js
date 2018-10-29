var Widget = require('../common/widget'),
    doubletab = require('../mixins/double_tap'),
    html = require('nanohtml')

class Toggle extends Widget {

    static defaults() {

        return super.defaults({

            _toggle: 'toggle',

            doubleTap: {type: 'boolean', value: false, help: 'Set to `true` to make the button require a double tap to be toggled instead of a single tap'},
            led: {type: 'boolean', value: false, help: 'Set to `true` to display the toggle\'s state with a led'},
            on: {type: '*', value: 1, help: [
                'Set to `null` to send send no argument in the osc message',
                'Can be an `object` if the type needs to be specified (see preArgs)'
            ]},
            off: {type: '*', value: 0, help: [
                'Set to `null` to send send no argument in the osc message',
                'Can be an `object` if the type needs to be specified (see preArgs)'
            ]}

        })

    }

    constructor(options) {

        super({...options, html: html`<div class="toggle"></div>`})

        this.state = 0
        this.active = false

        if (this.getProp('led')) this.container.classList.add('led')

        if (this.getProp('doubleTap')) {

            doubletab(this.widget, ()=>{
                var newVal = this.state?this.getProp('off'):this.getProp('on')
                this.setValue(newVal,{sync:true,send:true})
            })

        } else {

            this.on('draginit',()=>{
                if (this.active) return
                this.active = true
                var newVal = this.state?this.getProp('off'):this.getProp('on')
                this.setValue(newVal,{sync:true,send:true})
            }, false, {element: this.widget})

            this.on('dragend',()=>{
                this.active = false
            }, false, {element: this.widget})

        }

        this.value = this.getProp('off')

    }

    setValue(v,options={}) {

        if (typeof v == 'object' && v !== null) v = v.value
        if (v===this.getProp('on') || (this.getProp('on') != null && v === this.getProp('on').value && v !== undefined)) {
            this.widget.classList.add('on')
            this.container.classList.add('on')
            this.state = 1
            this.value = this.getProp('on')
            if (options.send) this.sendValue()
        } else if (v===this.getProp('off') || (this.getProp('off') != null && v === this.getProp('off').value && v !== undefined)) {
            this.widget.classList.remove('on')
            this.container.classList.remove('on')
            this.state = 0
            this.value = this.getProp('off')
            if (options.send) this.sendValue()
        }

        if (options.sync) this.changed(options)

    }

}

Toggle.dynamicProps = Toggle.prototype.constructor.dynamicProps.concat(
    'on',
    'off'
)

module.exports = Toggle
