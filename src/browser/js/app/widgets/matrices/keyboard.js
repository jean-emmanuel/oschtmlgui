var _matrix_base = require('./_matrix_base'),
    parser = require('../../parser')


module.exports = class Keyboard extends _matrix_base {

    static defaults() {

        return super.defaults({

            _matrix: 'matrix',

            keys: {type: 'number', value: 25, help: 'Defines the number keys'},
            start: {type: 'number', value: 48, help: [
                'MIDI note number to start with (default is C4)',
                'Standard keyboards settings are: `[25, 48]`, `[49, 36]`, `[61, 36]`, `[88, 21]`'
            ]},
            traversing: {type: 'boolean', value: true, help: 'Set to `false` to disable traversing gestures'},
            on: {type: '*', value: 1, help: [
                'Set to `null` to send send no argument in the osc message',
                'Can be an `object` if the type needs to be specified (see preArgs)'
            ]},
            off: {type: '*', value: 0, help: [
                'Set to `null` to send send no argument in the osc message',
                'Can be an `object` if the type needs to be specified (see preArgs)'
            ]},

        }, ['_value', 'default', 'value'], {

            split: {type: 'boolean|string', value: false, help: [
                '`true`: the widget\'s index will be appended to the matrice\'s osc address',
                '`false`: it will be prepended to the widget\'s preArgs',
                '`string`: will be used to define the widgets\' addresses, replacing dollar signs (`$`) with their respective index (to insert the actual dollar sign, it must be escaped with a backslash (`\\$`))'
            ]},
            css: {type: 'string', value: '', help: [
                'Available CSS variables:',
                '- `--color-white:color;` (white keys color)',
                '- `--color-black:color;` (black keys color)'
            ]}

        })

    }

    constructor(options) {

        super(options)

        this.keys = parseInt(this.getProp('keys'))

        var strData = JSON.stringify(options.props),
            pattern = 'wbwbwwbwbwbw',
            whiteKeys = 0, whiteKeys2 = 0, i

        for (i = this.start; i < this.keys + this.start && i < 109; i++) {
            if (pattern[i % 12] == 'w') whiteKeys++
        }

        for (i = this.start; i < this.keys + this.start && i < 109; i++) {

            var data = JSON.parse(strData)

            data.top = data.left = data.height = data.width = 'auto'
            data.type = 'push'
            data.id = this.getProp('id') + '/' + i
            data.label = false
            data.css = ''

            if (!this.getProp('split')) {
                data.address = '@{parent.address}'
                data.preArgs = '#{concat(@{parent.preArgs},[' + i + '])}'
            } else if (typeof this.getProp('split') === 'string' && this.getProp('split')[0] === '/' && /[^\\]\$/.test(this.getProp('split'))) {
                data.address = this.getProp('split').replace(/([^\\])(\$)/g,'$1' + i).replace(/\\\$/g, '$')
                data.preArgs = '@{parent.preArgs}'
            } else if (this.getProp('split')) {
                data.address = '@{parent.address}/' + i
                data.preArgs = '@{parent.preArgs}'
            }

            var key = parser.parse({
                data: data,
                parentNode: this.widget,
                parent: this
            })
            
            key.container.classList.add('not-editable')

            if (pattern[i % 12] == 'w') {
                key.container.classList.add('white')
                key.container.style.width = `${100/whiteKeys}%`
                whiteKeys2++
            } else {
                key.container.classList.add('black')
                key.container.style.width = `${60 / whiteKeys}%`
                key.container.style.left = `${100 / whiteKeys * (whiteKeys2 - 3/10)}%`
            }

            this.value[i-this.start] = this.getProp('off')

        }

    }

}
