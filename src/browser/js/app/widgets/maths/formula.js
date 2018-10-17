var Widget = require('../common/widget'),
    widgetManager = require('../../managers/widgets'),
    {math} = require('../utils'),
    Input = require('../inputs/input')


module.exports = class Formula extends Widget {

    static defaults() {

        return super.defaults({

            _formula: 'formula',

            formula: {type: 'string', value: '', help: ''},
            condition: {type: 'string', value: '', help: ''},
            unit: {type: 'string', value: '', help: ''},

        })

    }

    constructor(options) {

        var html = `
            <div class="formula">
            </div>
        `
        super({...options, html: html})


        this.formulaString = String(this.getProp('formula'))
        this.conditionString = String(this.getProp('condition'))

        this.input = new Input({
            props:{
                ...Input.defaults()._props(),
                editable:false,
                precision:this.getProp('precision'),
                unit: this.getProp('unit')
            },
            parent:this, parentNode:this.widget
        })

        this.widget.appendChild(this.input.widget)

        this.linkedWidgets = []

        if (this.formulaString.length) {

            if (this.formulaString.match(/\$\{([^}]*)\}/g) != null) this.linkedWidgets = this.linkedWidgets.concat(this.formulaString.match(/\$\{([^}]*)\}/g).map((a)=>{return a.substr(2, a.length - 3)}))

        }

        if (this.conditionString.length) {

            if (this.conditionString.match(/\$\{([^}]*)\}/g) != null) this.linkedWidgets = this.linkedWidgets.concat(this.conditionString.match(/\$\{([^}]*)\}/g).map((a)=>{return a.substr(2, a.length - 3)}))

        }


        try {

            this.condition = math.compile(this.conditionString.replace(/\$\{([^}]*)\}/g, '_$1'))
            delete this.errors.condition

        } catch(err) {

            this.errors.condition = 'Error parsing formula "' + this.conditionString + '" (' + err + ')'

        }

        try {

            this.formula = math.compile(this.formulaString.replace(/\$\{([^}]*)\}/g, '_$1'))
            delete this.errors.formula

        } catch(err) {

            this.errors.formula = 'Error parsing formula "' + this.conditionString + '" (' + err + ')'

        }

        this.conditionState = true


        widgetManager.on('change', this.syncHandle.bind(this), {context: this})

        if (this.formulaString.length) this.updateValue({options:{}})

    }

    syncHandle(e) {

        if (this.linkedWidgets.indexOf(e.id)==-1 || !widgetManager.getWidgetById(e.id).length) return
        this.updateValue(e)

    }

    updateValue(e){

        var variables = {}

        for (let id of this.linkedWidgets) {
            if (id !== undefined) {
                variables['_'+id] = 0
                let widgets = widgetManager.getWidgetById(id)
                for (let w of widgets) {
                    if (w.getValue) {
                        variables['_'+id] = w.getValue()
                        break
                    }
                }

            }
        }

        if (this.conditionString.length) {

            try {

                var s = this.condition.eval(variables).valueOf()

                if (Array.isArray(s) && s.length == 1) s = s[0]

                this.conditionState = s.data !== undefined ? s.data : s

                delete this.errors.condition

            } catch(err) {

                this.errors.condition = 'Error parsing formula "' + this.conditionString + '" (' + err + ')'
                this.conditionState = false
            }

        }

        try {

            var v = this.formula.eval(variables).valueOf()

            if (Array.isArray(v) && v.length == 1) v = v[0]

            this.value = v.data ? v.data : v

            this.showValue()

            if (e.options.sync && this.conditionState) this.changed(e.options)
            if (e.options.send && this.conditionState) this.sendValue()

            delete this.errors.formula

        } catch(err) {

            this.errors.formula = 'Error parsing formula "' + this.formulaString + '" (' + err + ')'
            this.value = undefined

        }

    }

    showValue() {

        this.input.setValue(this.value)

        if (this.getProp('condition').length && !this.conditionState) {
            this.input.stringValue = '* ' + this.input.stringValue
            this.input.batchDraw()
        }

    }

    getSplit() {

        return typeof this.getProp('split') == 'object' && this.getProp('split').length ? this.getProp('split') : false

    }

    onPropChanged(propName, options, oldPropValue) {

        if (super.onPropChanged(...arguments)) return true

        switch (propName) {

            case 'color':
                if (this.input) this.input.onPropChanged('color')
                return

        }

    }

    onRemove() {
        this.input.onRemove()
        super.onRemove()
    }
}
