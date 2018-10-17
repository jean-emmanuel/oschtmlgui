var EventEmitter = require('../../events/event-emitter'),
    osc = require('../../osc'),
    nanoid = require('nanoid/generate'),
    widgetManager = require('../../managers/widgets'),
    {math} = require('../utils'),
    scopeCss = require('scope-css'),
    {iconify} = require('../../ui/utils'),
    resize = require('../../events/resize'),
    OscReceiver = require('./osc-receiver'),
    {deepCopy, deepEqual} = require('../../utils'),
    updateWidget = ()=>{}

var oscReceiverState = {}

var OSCProps = [
    'precision',
    'address',
    'preArgs',
    'target',
    'bypass'
]

var dummyDOM

DOM.ready(()=>{
    dummyDOM = DOM.create('<div></div>')
})

setTimeout(()=>{
    updateWidget = require('../../editor/data-workers').updateWidget
})

class Widget extends EventEmitter {

    static defaults(insert={}, except=[], push={}) {

        var defaults = {

            type: {type: 'string', value: 'auto', help: ''},
            id: {type: 'string', value: 'auto', help: 'Widgets sharing the same `id` will act as clones and update each other\'s value(s) without sending extra osc messages.' },
            linkId: {type: 'string|array', value: '', help: [
                'Widgets sharing the same `linkId` update each other\'s value(s) AND send their respective osc messages.',
                'When prefixed with >>, the `linkId` will make the widget act as a master (sending but not receiving)',
                'When prefixed with <<, the `linkId` will make the widget act as a slave (receiving but not sending)'
            ]},

            _geometry:'geometry',

            left: {type: 'number|string', value: 'auto', help: [
                'When both top and left are set to auto, the widget is positioned according to the normal flow of the page (from left to right, by order of creation).',
                'Otherwise, the widget will be absolutely positioned'
            ]},
            top: {type: 'number|percentage', value: 'auto', help: [
                'When both top and left are set to auto, the widget is positioned according to the normal flow of the page (from left to right, by order of creation).',
                'Otherwise, the widget will be absolutely positioned'
            ]},
            width: {type: 'number|percentage', value: 'auto', help: ''},
            height: {type: 'number|percentage', value: 'auto', help: ''},

            _style:'style',

            label: {type: 'string|boolean', value: 'auto', help: [
                'Set to `false` to hide completely',
                'Insert icons using the prefix ^ followed by the icon\'s name : ^play, ^pause, etc'
            ]},
            color: {type: 'string', value: 'auto', help: 'CSS color code. Set to "auto" to inherit from parent widget.'},
            css: {type: 'string', value: '', help: 'CSS rules'},

            _value: 'value',

            default: {type: '*', value: '', help: 'If set, the widget will be initialized with this value when the session is loaded.'},
            value: {type: '*', value: '', help: 'Define the widget\'s value depending on other widget\'s values / properties using property inheritance and property maths'},

            _osc: 'osc',

            precision: {type: 'integer|string', value: 2, help: [
                'Defines the number of decimals to display and to send.',
                'Set to `0` to send integers only.',
                'Data type can be specified by appending a valid osc type tag to the precision value, for example : `3d` will make the widget send double precision numbers rounded to three decimals'
            ]},
            address: {type: 'string', value: 'auto', help: 'OSC address for sending messages, it must start with a /'},
            preArgs: {type: '*|array', value: '', help: [
                'A value or array of values that will be prepended to the OSC messages.',
                'Values can be defined as objects if the osc type tag needs to be specified: `{type: "i", value: 1}`'
            ]},
            target: {type: 'string|array|null', value: '', help: [
                'This defines the targets of the widget\'s OSC messages',
                '- A `string` or `array` of strings formatted as follow: `ip:port` or `["ip:port"]`',
                '- If midi is enabled, targets can be `midi:device_name`',
                '- The special item `"self"` can be used to refer to the emitting client directly.',
                '- If no target is set, messages can still be sent if the server has default targets',
                '- The server\'s default targets can be bypassed by setting one of the items to `null`'
            ]},
            bypass: {type: 'boolean', value: false, help: 'Set to `true` to prevent the widget from sending any osc message'}

        }

        // okay that's bad, but keys happen to be ordered anyway...

        var alterDefaults = {}

        for (var k in defaults) {
            if (k === '_value') {
                for (var l in insert) {
                    alterDefaults[l] = insert[l]
                }
            }
            if (except.indexOf(k) < 0) alterDefaults[k] = defaults[k]
        }

        for (var m in push) {
            alterDefaults[m] = push[m]
        }

        alterDefaults._props = function() {
            var props = {}
            for (var k in this) {
                if (k[0] !== '_') {
                    props[k] = this[k].value
                }
            }
            return props
        }


        return alterDefaults

    }

    constructor(options={}) {

        super()

        this.widget = DOM.create(options.html)
        this.props = options.props
        this.errors = {}
        this.parsers = {}
        this.parent = options.root ? widgetManager : options.parent
        this.parentNode = options.parentNode
        this.hash = nanoid('abcdefghijklmnopqrstuvwxyABCDEFGHIJKLMNOPQRSTUVWXYZ', 10)
        this.children = []
        this.reCreateOptions = options.reCreateOptions

        // strip parent ? no position
        if (this.parent && this.parent.props && this.parent.props.type == 'strip') {
            delete this.props.top
            delete this.props.left
            delete this.props[this.parent.getProp('horizontal') ? 'height' : 'width']
        }

        // @{props} links lists
        this.linkedProps = {}
        this.linkedPropsValue = {}

        // OSC{/path} receivers
        this.oscReceivers = {}

        // cache props (resolve @{props})
        this.cachedProps = {}
        this.changedPropSet = {}

        for (var k in this.props) {
            if (k != 'widgets' && k != 'tabs') {
                this.cachedProps[k] = this.resolveProp(k, undefined, true)
            } else {
                this.cachedProps[k] = this.props[k]
            }
        }

        if (this.getProp('id') == 'root' && !options.root) {
            this.cachedProps.id = '_root'
            this.errors.id = 'There can only be one root'
        }

        if (Object.keys(this.linkedProps).length) {

            widgetManager.on('widget-created', (e)=>{
                var {id, widget, options} = e
                if (widget == this.parent) return
                if (widget == this) id = 'this'
                if (this.linkedProps[id]) {
                    this.updateProps(this.linkedProps[id], widget, options)
                }
            }, {context: this})

            widgetManager.on('prop-changed', (e)=>{
                let {id, widget, options} = e
                if (widget == this) id = 'this'
                if (widget == this.parent) id = 'parent'
                if (this.linkedProps[id]) {
                    this.updateProps(this.linkedProps[id], widget, options, e.props)
                }
            }, {context: this})

        }

        if (Object.keys(this.linkedPropsValue).length) {

            widgetManager.on('change', (e)=>{
                var {id, widget, options} = e
                if (widget == this) id = 'this'
                if (widget == this.parent) id = 'parent'
                if (this.linkedPropsValue[id]) {
                    this.updateProps(this.linkedPropsValue[id], widget, options, ['value'])
                }
            }, {context: this})

        }

        var selfLinkedOSCProps = (this.linkedPropsValue['this'] || []).filter(i=>OSCProps.indexOf(i) > -1)
        this.selfLinkedOSCProps = selfLinkedOSCProps.length ? selfLinkedOSCProps : false


        this.disabledProps = []

        // cache precision
        if (this.props.precision != undefined) {
            this.precision = Math.min(20,Math.max(this.getProp('precision', undefined, false),0))
        }

        if (options.container) {

            this.container = DOM.create(`
                <div class="widget ${options.props.type}-container" id="${this.hash}" data-widget="${this.hash}"></div>
            `)
            this.label = DOM.create('<div class="label"></div>')
            this.container.appendChild(this.label)
            this.container.appendChild(this.widget)
            this.container._widget_instance = this
            this.setContainerStyles()
        } else {
            this.container = dummyDOM
        }

    }

    contains(widget) {

        if (this.children.indexOf(widget) > 0) return true

        var parent = widget.parent
        while (parent && parent !== widgetManager) {
            if (parent === this) return true
            parent = parent.parent
        }
        return false

    }

    getAllChildren() {

        var children = []
        for (var i = 0; i < this.children.length; i++) {
            if (!this.children[i]) continue
            children.push(this.children[i])
            children = children.concat(this.children[i].getAllChildren())
        }
        return children


    }

    created(index) {

        this.trigger('widget-created', [{
            id: this.getProp('id'),
            widget: this,
            options: this.reCreateOptions,
            index: index
        }])

    }

    changed(options) {

        this.trigger('change', [{
            widget: this,
            options: options,
            id: this.getProp('id'),
            linkId: this.getProp('linkId')
        }])

    }

    sendValue(overrides, options={}) {

        if (this.selfLinkedOSCProps) {
            this.updateProps(this.selfLinkedOSCProps, this)
        }

        if (this.getProp('bypass') && !options.force) return

        var data = {
            h:this.hash,
            v:this.value
        }

        if (overrides) {
            for (var k in overrides) {
                data[k] = overrides[k]
            }
        }

        if (options.syncOnly) {

            osc.sync(data)

        } else {

            osc.send(data)

        }

    }

    setValue() {}

    getValue(withPrecision) {

        return deepCopy(this.value, withPrecision ? this.precision : undefined)

    }

    getSplit() {}

    resolveProp(propName, propValue, storeLinks=true, originalWidget, originalPropName, context) {

        propValue = propValue !== undefined ? propValue : deepCopy(this.props[propName])
        originalWidget = originalWidget || this
        originalPropName = originalPropName || propName

        var variables = {},
            mathscope = context || {},
            varnumber = 0

        if (typeof propValue == 'string') {

            propValue = propValue.replace(/@\{[^{]*?(@\{.*?\})?[^{]*?\}/g, (m, nested)=>{

                if (nested) {
                    m = m.replace(nested, this.resolveProp(propName, nested, false, this))
                }

                let id = m.substr(2, m.length - 3).split('.'),
                    k, subk

                if (id.length > 1) {

                    k = id.pop()
                    subk = undefined

                    if (id.length > 1) {
                        subk = k
                        k = id.pop()
                    }

                    id = id.join('.')

                } else {

                    id = id[0]
                    k = 'value'

                }

                // backward compat
                if (k === '_value') k = 'value'

                var widgets = id == 'parent' && this.parent ?
                    [this.parent] : id == 'this' ? [this] :
                        widgetManager.getWidgetById(id)

                if (!widgets.length) {
                    var parent = this.parent
                    while (parent && parent != widgetManager) {
                        if (parent.getProp('id') == id) {
                            widgets.push(parent)
                            break
                        }
                        parent = parent.parent
                    }
                }


                // ignore clone wrapper in @parent stack (https://github.com/jean-emmanuel/open-stage-control/issues/379)
                if (widgets[0] === this.parent && this.parent.getProp('type') === 'clone') widgets = [this.parent.parent]

                if (storeLinks) {

                    if (k == 'value') {

                        if (!this.linkedPropsValue[id]) this.linkedPropsValue[id] = []
                        if (this.linkedPropsValue[id].indexOf(propName) == -1) this.linkedPropsValue[id].push(propName)

                    } else {

                        if (!this.linkedProps[id]) this.linkedProps[id] = []
                        if (this.linkedProps[id].indexOf(propName) == -1) this.linkedProps[id].push(propName)

                    }

                }

                for (var i in widgets) {

                    if (widgets[i] === widgetManager) continue

                    if (widgets[i].props[k] !== undefined || k === 'value') {

                        if (k !== 'value' && originalPropName == k && widgets[i].props.id == originalWidget.props.id) {
                            return undefined
                        }

                        var r = k == 'value' ?
                            widgets[i].getValue(true) :
                            widgets[i].resolveProp(k, undefined, storeLinks, originalWidget, originalPropName)

                        if (subk !== undefined && r !== undefined) r = r[subk]

                        var varname = 'VAR_' + varnumber
                        varnumber++

                        variables[varname] = r
                        mathscope[varname] = r

                        return varname

                    }

                }

            })

            propValue = propValue.replace(/OSC\{([^}]+)\}/g, (m)=>{
                let [address, value] = m.substr(4, m.length - 5).split(',').map(x=>x.trim()),
                    resolvedAddress = address.replace(/VAR_[0-9]+/g, (m)=>{
                        return typeof variables[m] === 'string' ? variables[m] : JSON.stringify(variables[m])
                    })

                if (!this.oscReceivers[address]) {
                    this.oscReceivers[address] = new OscReceiver(resolvedAddress, value, this, propName)
                    if (oscReceiverState[address]) {
                        this.oscReceivers[address].value = oscReceiverState[address]
                        delete oscReceiverState[address]
                    }
                } else {
                    this.oscReceivers[address].setAddress(resolvedAddress)
                }

                var r = this.oscReceivers[address].value

                var varname = 'VAR_' + varnumber
                varnumber++

                variables[varname] = r
                mathscope[varname] = r

                return varname
            })

            try {
                propValue = propValue.replace(/#\{(?:[^{}]|\{[^{}]*\})*\}/g, (m)=>{
                    // one bracket nesting allowed, if we need two: #\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}

                    // unescape brackets (not needed anymore, just here for backward compatibility)
                    m = m.replace(/\\(\{|\})/g, '$1')

                    // espace multiline strings
                    m = m.replace(/`([^`]*)`/g, (m)=>{
                        return m.replace(/"/g,'\\"').replace(/\n/g,'\\n').replace(/`/g,'"')
                    })

                    if (!this.parsers[m]) this.parsers[m] = math.compile(m.substr(2, m.length - 3).trim())

                    let r = this.parsers[m].eval(mathscope)

                    if (r instanceof math.type.ResultSet && !r.entries.length) {
                        r = ''
                    } else if (typeof r === 'object' && r !== null && r.valueOf) {
                        r = r.valueOf()
                        if (Array.isArray(r) && r.length == 1) r = r[0]
                    }

                    return typeof r != 'string' ? JSON.stringify(r) : r
                })
            } catch (err) {}

            for (let k in variables) {
                var v = typeof variables[k] === 'string' ? variables[k] : JSON.stringify(variables[k])
                propValue = propValue.replace(new RegExp(k, 'g'), v)
            }

            // support object unfolding
            let unfoldIdx = propValue.indexOf("...")
            while(unfoldIdx>=0){
                propValue=propValue.slice(0,unfoldIdx)+ propValue.slice(unfoldIdx+3);
                
                let startIdx = -1
                ,endIdx = -1
                ,nest = 0
                ,isEmpty = true
                while(unfoldIdx<propValue.length){
                    const c = propValue[unfoldIdx]
                    if(c==='}'){nest-=1}
                    if(nest===0 && startIdx>0){
                        endIdx=unfoldIdx
                        break
                    }
                    if(nest>0 && isEmpty && c!==' '){
                        isEmpty=false
                    }
                    if(c==='{'){if(nest===0){startIdx =unfoldIdx} nest+=1}

                    unfoldIdx++
                }

                if(endIdx>0 && startIdx>0){
                    // delete trailing comma if empty
                    let tail = 0
                    if(isEmpty){
                        const nextComma = propValue.indexOf(",",endIdx)
                        if(nextComma>=0){
                            tail = nextComma-endIdx
                        }
                    }
                    
                    propValue = propValue.slice(0,startIdx)+ propValue.slice(startIdx+1);
                    propValue = propValue.slice(0,endIdx-1)+ propValue.slice(endIdx+tail);
                    
                }

                unfoldIdx = propValue.indexOf("...")
            }

            try {
                propValue = JSON.parse(propValue)
            } catch (err) {}

        } else if (propValue != null && typeof propValue == 'object') {
            for (let k in propValue) {
                propValue[k] = this.resolveProp(propName, propValue[k], storeLinks, originalWidget, originalPropName, context)
            }
        }

        return propValue


    }

    getProp(propName) {
        return this.cachedProps[propName]
    }
    setProp(propName,propValue,changedSetName) {
        // otions = {alreadyResolved,changeSetName}
        // const {changedSetName = options
        const oldPropValue = this.getProp(propName)
        const changed = propValue!=oldPropValue
        if(!changed){return }

        const changeInfo = {propName,oldPropValue,propValue}
        if(changedSetName){
            if (!this.changedPropSet[changedSetName])this.changedPropSet[changedSetName] =[]
            this.changedPropSet[changedSetName].push(changeInfo)
        }
        
        else{
            const chOptions = {}
            this._notifyChangedProps([changeInfo],chOptions)

        }
    }

    applyPropChanges(changedSetName,options){
        const changedProps = this.changedPropSet[changedSetName]
        if (changedProps){
            this._notifyChangedProps(this.changedPropSet[changedSetName],options)
            delete this.changedPropSet[changedSetName] 
        }
    }

    updateProps(propNames, widget, options, updatedProps = []) {

        if (propNames.includes('value')) {
            propNames.splice(propNames.indexOf('value'), 1)
            propNames.push('value')
        }

        var reCreate = false,
            changedProps = []

        for (var propName of propNames) {

            if (widget === this && updatedProps.includes(propName)) continue

            let propValue = this.resolveProp(propName, undefined, false),
                oldPropValue = this.getProp(propName)

            if (!deepEqual(oldPropValue, propValue)) {


                if (!this.constructor.dynamicProps.includes(propName)) {

                    reCreate = true

                } else {

                    this.cachedProps[propName] = propValue
                    changedProps.push({propName, oldPropValue,propValue})

                }


            }
        }
        if (reCreate && !this.contains(widget) && widget !== this && !(widget === this && updatedProps.length === 1 && updatedProps[0] === 'value')) {

            this.reCreateWidget(options)
            return true

        } else if (changedProps.length) {

            this._notifyChangedProps(changedProps,options)

        }

    }

    _notifyChangedProps(changedProps,options={}){
        const {doResolve} = options
            for (var i in changedProps) {
            const {propName,propValue,oldPropValue}  = changedProps[i]
            this.props[propName] = propValue
            this.cachedProps[propName] = doResolve?this.resolveProp(propName,false):propValue
            this.onPropChanged(propName, options, oldPropValue)
            }

        this.trigger('prop-changed.*', [{
                id: this.getProp('id'),
                props: changedProps,
                widget: this,
                options: options
            }])

        }

    onPropChanged(propName, options, oldPropValue) {

        switch(propName) {

            case 'value':
                this.setValue(this.getProp('value'), {sync: true, send: options && options.send})
                return

            case 'top':
            case 'left':
            case 'height':
            case 'width':
                this.setContainerStyles(['geometry'])
                resize.check(this.container)
                return

            case 'label':
                this.setContainerStyles(['label'])
                return

            case 'css':
                this.setContainerStyles(['css'])
                this.onPropChanged('color')
                var re = /width|height|display/
                if (re.test(oldPropValue) || re.test(this.getProp('css'))) {
                    resize.check(this.container)
                }
                return

            case 'color':
                this.setContainerStyles(['color'])
                return

            case 'precision':
            case 'address':
            case 'preArgs':
            case 'target':
            case 'noSync':
                if (propName == 'precision') this.precision = Math.min(20,Math.max(this.getProp('precision', undefined, false),0))
                var data = {},
                    oldData = {
                        preArgs: propName == 'preArgs' ? oldPropValue : this.getProp('preArgs'),
                        address: propName == 'address' ? oldPropValue : this.getProp('address')
                    }
                data[propName] = this.getProp(propName)
                if (propName === 'address' && this.getSplit()) {
                    data['split'] = this.getSplit()
                }
                widgetManager.registerWidget(this, data, oldData)
                return

        }

    }

    setContainerStyles(styles = ['geometry', 'label', 'css', 'color']) {

        if (styles.includes('geometry')) {

            // geometry
            for (let d of ['width', 'height', 'top', 'left']) {
                let val = this.getProp(d),
                    geometry

                if (val !== undefined) {
                    if (parseFloat(val) < 0) val = 0
                    geometry = parseFloat(val) == val ? parseFloat(val)+'rem' : val
                }

                if (geometry && geometry != 'auto') {
                    this.container.style[d] = geometry
                    if (d == 'width') this.container.style.minWidth = geometry
                    if (d == 'height') this.container.style.minHeight = geometry
                    if (d == 'top' || d == 'left') this.container.classList.add('absolute-position')
                }
            }

        }

        if (styles.includes('label')) {

            // label
            if (this.getProp('label') === false) {
                this.container.classList.add('nolabel')
            } else {
                var label = this.getProp('label') == 'auto'?
                    this.getProp('id'):
                    iconify(this.getProp('label'))

                this.label.innerHTML = label
            }

        }

        if (styles.includes('css')) {

            // css
            var css = String(this.getProp('css')),
                prefix = '#' + this.hash,
                scopedCss = scopeCss(css, prefix),
                unScopedCss = ''

            try {

                dummyDOM.style = css
                unScopedCss = dummyDOM.getAttribute('style') || ''

            } catch(err) {

                // fallback for browser that don't allow assigning "style" property
                css
                    .replace(/\{[^}]*\}/g, '')
                    .replace(/^[^@#.]*:.*/gm, (m)=>{
                        unScopedCss += m[m.length - 1] === ';' ? m : m + ';'
                    })

            }



            if (scopedCss.indexOf('@keyframes') > -1) scopedCss = scopedCss.replace(new RegExp(prefix + '\\s+([0-9]+%|to|from)', 'g'), ' $1')
            if (scopedCss.indexOf('&') > -1) scopedCss = scopedCss.replace(new RegExp(prefix + '\\s&', 'g'), prefix)

            var style = DOM.create(`<style>${unScopedCss ? prefix + '{' + unScopedCss + '}\n' : ''}${scopedCss}</style>`),
                oldStyle = DOM.get(this.container, '> style')[0]

            if (oldStyle) {
                this.container.replaceChild(style, oldStyle)
            } else if (scopedCss.length || unScopedCss.length){
                this.container.insertBefore(style, this.widget)
            }

        }

        if (styles.includes('color')) {

            // color
            this.container.style.setProperty('--color-custom', this.getProp('color') && this.getProp('color') != 'auto' ? this.getProp('color') : '')

        }


    }

    reCreateWidget(options){

        updateWidget(this, {remote: true, reCreateOptions:options})

    }

    onRemove(){

        widgetManager.removeEventContext(this)
        osc.removeEventContext(this)
        for (var i in this.oscReceivers) {
            oscReceiverState[i] = this.oscReceivers[i].value
        }

    }

}

Widget.dynamicProps = [
    'top',
    'left',
    'height',
    'width',
    'label',
    'css',
    'value',
    'color',
    'precision',
    'address',
    'preArgs',
    'target',
    'bypass'
]

module.exports = Widget
