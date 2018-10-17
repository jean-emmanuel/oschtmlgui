var _matrix_base = require('./_matrix_base'),
    parser = require('../../parser'),
    widgetManager = require('../../managers/widgets')

class Matrix extends _matrix_base {

    static defaults() {

        return super.defaults({

            _matrix: 'matrix',

            widgetType: {type: 'string', value: 'toggle', help: 'Defines the type of the widgets in the matrix'},
            matrix: {type: 'array', value: [2,2], help: 'Defines the number of columns and and rows in the matrix'},
            start: {type: 'integer', value: 0, help: 'First widget\'s index'},
            spacing: {type: 'integer', value: 0, help: 'Adds space between widgets'},
            traversing: {type: 'boolean', value: true, help: 'Set to `false` to disable traversing gestures'},
            border: {type: 'boolean', value: true, help: 'Set to `false` to disables the widgets\' borders'},
            props: {type: 'object', value: {}, help: [
                'Defines a set of property to override the widgets\' defaults.',
                'Formulas in this field are resolved with an extra variable representing each widget\'s index: `$`'
            ]}

        }, [], {})

    }

    constructor(options) {

        super(options)

        this.widget.style.setProperty('--columns', this.getProp('matrix')[0])
        this.widget.style.setProperty('--rows', this.getProp('matrix')[1])
        this.widget.style.setProperty('--spacing', this.getProp('spacing') + 'rem')

        if (this.getProp('borders') === false) this.widget.classList.add('noborders')

        if (parser.widgets[this.getProp('widgetType')]) {

            for (var i = this.start; i < this.getProp('matrix')[0] * this.getProp('matrix')[1] + this.start; i++) {

                var props = this.resolveProp('props', undefined, false, false, false, {'$':i})
                var data = {
                    type: this.getProp('widgetType'),
                    id: this.getProp('id') + '/' + i,
                    label: i,
                    top: 'auto',
                    left: 'auto',
                    height: 'auto',
                    width: 'auto'
                }
                if (typeof props === 'object' && props !== null) {
                    Object.assign(data, props)
                }

                var widget = parser.parse({
                    data: data,
                    parentNode: this.widget,
                    parent: this
                })

                widget.container.classList.add('not-editable')

                this.value[i-this.start] = widget.getValue()

            }

        } else {

            this.errors.widgetType = this.getProp('widgetType') + ' is not a valid widget type'

        }

    }

    onPropChanged(propName, options, oldPropValue) {

        if (super.onPropChanged(...arguments)) return true

        switch (propName) {

            case 'props':


                for (let i = this.children.length - 1; i >= 0; i--) {

                    let data = this.resolveProp('props', undefined, false, false, false, {'$':i})

                    if (typeof data === 'object' && data !== null) {
                        Object.assign(this.children[i].props, data)
                    }
                    this.children[i].updateProps(Object.keys(data), this)
                    // this.children[i] might have been recreated
                    this.children[i].container.classList.add('not-editable')

                }

                return

        }

    }

}


Matrix.dynamicProps = Matrix.prototype.constructor.dynamicProps.concat(
    'props'
)

module.exports = Matrix
