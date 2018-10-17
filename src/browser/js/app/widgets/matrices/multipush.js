var _matrix_base = require('./_matrix_base'),
    parser = require('../../parser')

module.exports = class Multipush extends _matrix_base {

    static defaults() {

        return super.defaults({

            _matrix: 'matrix',

            matrix: {type: 'array', value: [2,2], help: [
                'Defines the number of columns and and rows in the matrix. Each cell will contain a push button that will inherit its parent\'s properties and the following ones (where i is the push\'s index)',
                '- `id`: same as the widget\'s with /i appended to it',
                '- `label`: i',
                '- `address`: see split'
            ]},
            start: {type: 'integer', value: 0, help: 'First widget\'s index'},
            traversing: {type: 'boolean', value: true, help: 'Set to `false` to disable traversing gestures'},
            spacing: {type: 'integer', value: 0, help: 'Adds space between widgets'},

            _push: 'push',

            on: {type: '*', value: 1, help: [
                'Set to `null` to send send no argument in the osc message',
                'Can be an `object` if the type needs to be specified (see preArgs)'
            ]},
            off: {type: '*', value: 0, help: [
                'Set to `null` to send send no argument in the osc message',
                'Can be an `object` if the type needs to be specified (see preArgs)'
            ]},
            norelease: {type: 'boolean', value: false, help: 'Set to `true` to prevent sending any osc message when releasing the button'},

        }, ['_value', 'default', 'value'], {

            split: {type: 'boolean|string', value: false, help: [
                '`true`: the widget\'s index will be appended to the matrice\'s osc address',
                '`false`: it will be prepended to the widget\'s preArgs',
                '`string`: will be used to define the widgets\' addresses, replacing dollar signs (`$`) with their respective index (to insert the actual dollar sign, it must be escaped with a backslash (`\\$`))'
            ]}

        })

    }

    constructor(options) {

        super(options)

        this.widget.style.setProperty('--columns', this.getProp('matrix')[0])
        this.widget.style.setProperty('--rows', this.getProp('matrix')[1])
        this.widget.style.setProperty('--spacing', this.getProp('spacing') + 'rem')

        var strData = JSON.stringify(options.props)

        for (var i = this.start; i < this.getProp('matrix')[0] * this.getProp('matrix')[1] + this.start; i++) {

            var data = JSON.parse(strData)

            data.top = data.left = data.height = data.width = 'auto'
            data.type = 'push'
            data.id = this.getProp('id') + '/' + i
            data.label = i
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

            var push = parser.parse({
                data: data,
                parentNode: this.widget,
                parent: this
            })

            push.container.classList.add('not-editable')

            this.value[i-this.start] = this.getProp('off')

        }

    }

}
