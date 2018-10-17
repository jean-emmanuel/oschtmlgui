var Container = require('../common/container'),
    widgetManager = require('../../managers/widgets'),
    parser = require('../../parser')

class Panel extends Container {

    static defaults() {

        return super.defaults({

            _panel:'panel',

            scroll: {type: 'boolean', value: true, help: 'Set to `false` to disable scrollbars'},
            border: {type: 'boolean', value: true, help: 'By default, widgets in panels/strip have their border disabled, except for panels and strips. Set to `false` to apply this rule to the panel too'},

        }, [], {

            _children:'children',

            variables: {type: '*', value: '@{parent.variables}', help: 'Defines one or more arbitrary variables that can be inherited by children widgets'},
            widgets: {type: 'array', value: [], help: 'Each element of the array must be a widget object. A panel cannot contain widgets and tabs simultaneously.'},
            tabs: {type: 'array', value: [], help: 'Each element of the array must be a tab object. A panel cannot contain widgets and tabs simultaneously'},

            value: {type: 'integer', value: '', help: [
                'Defines currently opened tab in the widget',
                'A tab can be opened only by setting its parent\'s value'
            ]},

        })


    }

    constructor(options) {


        super({...options, html: '<div class="panel"></div>'})

        if (this.getProp('scroll') === false) this.widget.classList.add('noscroll')
        if (this.getProp('border') === false) this.container.classList.add('noborder')
        if (this.getProp('tabs') && this.getProp('tabs').length) this.widget.classList.add('has-tabs')

        this.value = -1
        this.tabs = []

        if (this.getProp('tabs') && this.getProp('tabs').length) {

            this.widget.appendChild(DOM.create('<div class="navigation"><ul class="tablist"></ul></div>'))
            this.navigation = DOM.get(this.widget, '.tablist')[0]

            this.wrapper = this.widget.appendChild(DOM.create('<div class="tabs-wrapper"></div>'))

            this.children = options.children || new Array(this.getProp('tabs').length)
            for (let i = 0; i < this.children.length; i++) {
                if (this.children[i]) {
                    this.wrapper.appendChild(this.children[i].container)
                    this.children[i].parent = this
                    this.children[i].parentNode = this.wrapper
                    this.children[i].props = this.getProp('tabs')[i]
                } else {
                    parser.parse({
                        data: this.getProp('tabs')[i],
                        parentNode: this.wrapper,
                        parent: this,
                        tab: true,
                        index: i
                    })
                }
            }

            this.createNavigation()

            this.navigation.addEventListener('fast-click', (e)=>{
                if (!e.target.hasAttribute('data-widget')) return
                var index = DOM.index(e.target)
                this.setValue(index, {sync: true, send:this.value != index})
            })

            this.on('tab-created', (e)=>{
                this.createNavigation()
                e.stopPropagation = true
            })

            this.setValue(this.getProp('value') || 0)

        } else if (this.getProp('widgets') && this.getProp('widgets').length) {

            this.children = options.children || new Array(this.getProp('widgets').length)
            for (let i = 0; i < this.children.length; i++) {
                if (this.children[i]) {
                    this.widget.appendChild(this.children[i].container)
                    this.children[i].parent = this
                    this.children[i].parentNode = this.widget
                    this.children[i].props = this.getProp('widgets')[i]
                } else {
                    parser.parse({
                        data: this.getProp('widgets')[i],
                        parentNode: this.widget,
                        parent: this,
                        index: i
                    })
                }
            }

        }

        if (this.getProp('tabs') && !this.getProp('tabs').length) {
            this.disabledProps.push(
                'precision', 'address', 'preArgs', 'target', 'bypass',
                'value', 'default'
            )
        }
        if (this.getProp('widgets') && !this.getProp('widgets').length) {
            this.disabledProps.push(
                'scroll'
            )
        }



    }

    createNavigation() {

        this.navigation.innerHTML = ''
        this.tabs = []

        var html = ''
        DOM.each(this.wrapper, '> .widget', (tab)=>{

            let widget = widgetManager.getWidgetByElement(tab),
                style = widget.getProp('color') == 'auto' ? '' : `style="--color-custom:${widget.getProp('color')}"`

            this.tabs.push(widget)
            html += `<li class="tablink" data-widget="${widget.hash}" ${style}><a><span>${DOM.get(tab, '> .label')[0].innerHTML}</span></a></li>`

        })

        this.navigation.innerHTML = html

        this.setValue(this.value)

    }

    setValue(v, options={}) {
        if (this.tabs.length && typeof v == 'number' && v >= 0 && v < this.tabs.length) {

            for (let i in this.tabs) {
                if (i != v) this.tabs[i].hide()
            }

            this.value = v

            this.tabs[v].show()
            DOM.each(this.navigation, 'li', (el)=>{el.classList.remove('on')})[v].classList.add('on')

            if (options.send) this.sendValue()
            if (options.sync) this.changed(options)

        }
    }

    scroll(s) {

        if (!s) {
            return [this.widget.scrollLeft, this.widget.scrollTop]
        } else {
            this.widget.scrollLeft = s[0]
            this.widget.scrollTop = s[1]
        }

    }

    onPropChanged(propName, options, oldPropValue) {

        if (super.onPropChanged(...arguments)) return true

        switch (propName) {

            case 'color':
                for (var w of this.children) {
                    w.onPropChanged('color')
                }
                return

        }

    }


    onRemove() {
        this.off('resize')
        super.onRemove()
    }

}

Panel.dynamicProps = Panel.prototype.constructor.dynamicProps.concat(
    'variables'
)

module.exports = Panel
