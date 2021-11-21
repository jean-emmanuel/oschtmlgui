var Panel = require('./panel'),
    Widget = require('../common/widget'),
    parser = require('../../parser'),
    {mapToScale} = require('../utils')


class Drumpads extends Panel {

    static description() {

        return 'Drumpads.'

    }

    static defaults() {

        return Widget.defaults().extend({
            style: {
            },
            class_specific: {
                pads: {type: 'number', value: 8, help: 'Defines the number of pads (one row)'},
                start: {type: 'number', value: 48, help: [
                    'MIDI note number to start with (default is C4)',
                    'Standard keyboards settings are: `[25, 48]`, `[49, 36]`, `[61, 36]`, `[88, 21]`'
                ]},
                on: {type: '*', value: 1, help: [
                    'Set to `null` to send no argument in the osc message',
                ]},
                off: {type: '*', value: 0, help: [
                    'Set to `null` to send no argument in the osc message',
                ]},
                velocity: {type: 'boolean', value: false, help: [
                    'Set to `true` to map the touch coordinates between `off` (top) and `on` (bottom). Requires `on` and `off` to be numbers',
                ]},
                mode: {type: 'string', value: 'push', choices: ['push', 'toggle', 'tap'], help: [
                    'Interraction mode:',
                    '- `push` (press & release)',
                    '- `toggle` (on/off switches)',
                    '- `tap` (no release)'
                ]}
            }
        })

    }

    constructor(options) {

        super(options)

        this.childrenType = undefined
        this.value = []
        this.height = 100
        this.width = 100

        this.on('resize', (e)=>{
            this.height = this.width = e.height
        }, {element: this.widget})


        this.on('change',(e)=>{

            var widget = e.widget

            if (widget === this) return


            var value
            if (widget.getValue()) {
                if (this.getProp('velocity')) {
                    var height = this.height
                    value = mapToScale(e.options.y, [0, height * 0.9], [this.getProp('off'), this.getProp('on')], this.decimals)
                } else {
                    value = this.getProp('on')
                }
            } else {
                value = this.getProp('off')
            }

            this.value[widget._index] = value

            if (e.options.send) {
                var start = parseInt(this.getProp('start'))
                this.sendValue({
                    v: [e.widget._index + start, value]
                })
            }

            this.changed({
                ...e.options,
                id: widget.getProp('id')
            })


        })

        var start = parseInt(this.getProp('start')),
        pads = parseInt(this.getProp('pads')),
        i


        this.container.style.setProperty('--nkeys', pads)

        // draw
        for (i = start; i < pads + start && i < 128; i++) {

            var data = {
                top: 'auto',
                left: 'auto',
                height: this.height,
                width: this.width,
                type: 'button',
                mode: this.getProp('mode'),
                id: this.getProp('id') + '/' + i,
                label: false,
                css: '',
                bypass: true,
                on: 1,
                off: 0,
            }

            var pad = parser.parse({
                data: data,
                parentNode: this.widget,
                parent: this
            })

            pad._index = i - start
            pad.container.classList.add('not-editable')
            pad._not_editable = true
            pad.container.classList.add('key')
            pad.container.classList.add('white')           

            this.value[i - start] = this.getProp('off')

        }
        

        

        /*var start = parseInt(this.getProp('start')),
            keys = parseInt(this.getProp('keys'))

        var pattern = 'wbwbwwbwbwbw',
            whiteKeys = 0, whiteKeys2 = 0, i

        for (i = start; i < keys + start && i < 128; i++) {
            if (pattern[i % 12] == 'w') whiteKeys++
        }

        this.container.style.setProperty('--nkeys', whiteKeys)

        for (i = start; i < keys + start && i < 128; i++) {

            var data = {
                top: 'auto',
                left: 'auto',
                height: 'auto',
                width: 'auto',
                type: 'button',
                mode: this.getProp('mode'),
                id: this.getProp('id') + '/' + i,
                label: false,
                css: '',
                bypass: true,
                on: 1,
                off: 0,
            }

            var key = parser.parse({
                data: data,
                parentNode: this.widget,
                parent: this
            })

            key._index = i - start
            key.container.classList.add('not-editable')
            key._not_editable = true
            key.container.classList.add('key')

            if (pattern[i % 12] == 'w') {
                key.container.classList.add('white')
                whiteKeys2++
            } else {
                key.container.classList.add('black')
                key.container.style.setProperty('--rank', whiteKeys2)
                key._black = true
            }

            this.value[i - start] = this.getProp('off')

        }*/

    }

    setValue(v, options={}) {

        if (!Array.isArray(v) || v.length !== 2) return
        if (v[1] !== this.getProp('on') && v[1] !== this.getProp('off')) return

        var start = parseInt(this.getProp('start'))
        this.children[v[0] - start].setValue(v[1] === this.getProp('on') ? 1 : 0, options)

    }

}


Drumpads.dynamicProps = Drumpads.prototype.constructor.dynamicProps.concat(
    'on',
    'off',
)

module.exports = Drumpads
