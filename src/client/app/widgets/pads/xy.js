var Pad = require('./pad'),
    Fader = require('./_fake_fader'),
    doubletab = require('../mixins/double_tap'),
    Input = require('../inputs/input'),
    touchstate = require('../mixins/touch_state')

var faderDefaults = Fader.defaults()._props()

module.exports = class Xy extends Pad {

    static defaults() {

        return super.defaults({

            _xy:'xy',

            pointSize: {type: 'integer', value: 20, help: 'Defines the points\' size'},
            snap: {type: 'boolean', value: false, help: [
                'By default, the points are dragged from their initial position.',
                'If set to `true`, touching anywhere on the widget\'s surface will make them snap to the touching coordinates',
            ]},
            spring: {type: 'boolean', value: false, help: 'When set to `true`, the widget will go back to its default value when released'},
            pips: {type: 'boolean', value: true, help: 'Set to `false` to hide the scale'},
            rangeX: {type: 'object', value: {min:0,max:1}, help: 'Defines the min and max values for the x axis'},
            rangeY: {type: 'object', value: {min:0,max:1}, help: 'Defines the min and max values for the y axis'},
            logScaleX: {type: 'boolean', value: false, help: 'Set to `true` to use logarithmic scale for the x axis (log10)'},
            logScaleY: {type: 'boolean', value: false, help: 'Set to `true` to use logarithmic scale for the y axis (log10)'},
            input: {type: 'boolean', value: true, help: 'Set to false to hide the built-in input widget'},
            doubleTap: {type: 'boolean|string', value: false, help: [
                'Set to `true` to make the fader reset to its default value when receiving a double tap.',
                'Can also be an osc address, which case the widget will just send an osc message: `/<doubleTap> <preArgs>`'
            ]},

        }, [], {

            touchAddress: {type: 'string', value:'', help: 'OSC address for touched state messages: `/touchAddress [preArgs] 0/1`)'},
            split: {type: 'boolean|object', value: false, help: [
                'Set to `true` to send separate osc messages for each point\'s x and y axis. The address will be the same as the widget\'s with `/x` or `/y` appended to it',
                'Can be set as an `object` to specify a different address : [\'/osc_address_x\', \'/osc_address_y\']',
                'Note: the widget will only respond to its original osc address, not to the splitted version'
            ]}

        })

    }

    constructor(options) {

        super(options)

        this.faders = {
            x: new Fader({props:{
                ...faderDefaults,
                id:0,
                compact:true,
                pips:false,
                horizontal:true,
                height:'100%',
                width:'100%',
                default:this.getProp('default').length === 2 ? this.getProp('default')[0] : '',
                snap:this.getProp('snap'),
                range:this.getProp('rangeX'),
                origin:'auto',
                precision:this.precision,
                logScale:this.getProp('logScaleX'),
                input:false
            }, cancelDraw: true, parent: this}),
            y: new Fader({props:{
                ...faderDefaults,
                id:1,
                compact:true,
                pips:false,
                horizontal:false,
                height:'100%',
                width:'100%',
                default:this.getProp('default').length === 2 ? this.getProp('default')[1] : '',
                snap:this.getProp('snap'),
                range:this.getProp('rangeY'),
                origin:'auto',
                precision:this.precision,
                logScale:this.getProp('logScaleY'),
                input:false
            }, cancelDraw: true, parent: this}),
        }

        this.faders.x.margin = this.faders.y.margin = this.pointSize + 1

        this.value = [this.faders.x.value, this.faders.y.value]

        this.wrapper.appendChild(this.faders.x.widget)
        this.wrapper.appendChild(this.faders.y.widget)

        this.faders.x.on('change',(e)=>{
            e.stopPropagation = true
        })

        this.faders.y.on('change',(e)=>{
            e.stopPropagation = true
        })

        touchstate(this, {element: this.wrapper})

        this.on('draginit',(e)=>{
            e.stopPropagation = true
            this.faders.x.trigger('draginit', e)
            this.faders.y.trigger('draginit', e)
            this.dragHandle()
        }, false, {element: this.wrapper})

        this.on('drag',(e)=>{
            this.faders.x.trigger('drag', e)
            this.faders.y.trigger('drag', e)
            this.dragHandle()
        }, false, {element: this.wrapper})

        this.on('dragend', (e)=>{
            e.stopPropagation = true
            this.faders.x.trigger('dragend', e)
            this.faders.y.trigger('dragend', e)
            if (this.getProp('spring')) {
                this.setValue([this.faders.x.springValue,this.faders.y.springValue],{sync:true,send:true})
            }
        }, false, {element: this.wrapper})

        if (this.getProp('doubleTap')) {

            if (typeof this.getProp('doubleTap') === 'string' && this.getProp('doubleTap')[0] === '/') {

                doubletab(this.widget, ()=>{
                    this.sendValue({v:null, address: this.getProp('doubleTap')})
                })

            } else {

                doubletab(this.wrapper, ()=>{
                    this.faders.x.setValue(this.faders.x.springValue, {sync: false, send:false, dragged:true})
                    this.faders.y.setValue(this.faders.y.springValue, {sync: false, send:false, dragged:true})
                    this.setValue([this.faders.x.springValue,this.faders.y.springValue],{sync:true, send:true})
                })

            }

        }

        if (this.getProp('input')) {

            this.input = new Input({
                props:{...Input.defaults()._props(), precision:this.getProp('precision'), unit:this.getProp('unit')},
                parent:this, parentNode:this.widget
            })
            this.widget.appendChild(this.input.widget)
            this.input.on('change', (e)=>{
                e.stopPropagation = true
                this.setValue(this.input.getValue(), {sync:true, send:true})
                this.showValue()
            })

        }

        this.setValue([0,0])

    }

    dragHandle(){

        var x = this.faders.x.value,
            y = this.faders.y.value


        if (x != this.value[0] || y != this.value[1]) {
            this.setValue([x, y],{send:true,sync:true,dragged:true})
        }

    }


    setValue(v, options={}) {

        if (!v || !v.length || v.length!=2) return
        if (this.touched && !options.dragged) return this.setValueTouchedQueue = [v, options]

        if (!options.dragged) {
            this.faders.x.setValue(v[0], {sync: false, send:false, dragged:false})
            this.faders.y.setValue(v[1], {sync: false, send:false, dragged:false})
        }

        this.value = [
            this.faders.x.value,
            this.faders.y.value
        ]

        if (options.send) this.sendValue()
        if (options.sync) this.changed(options)

        this.batchDraw()

        this.showValue()

    }

    draw() {

        var pointSize = this.pointSize * PXSCALE,
            margin = (this.pointSize + 1) * PXSCALE,
            x = this.faders.x.percentToCoord(this.faders.x.percent),
            y = this.faders.y.percentToCoord(this.faders.y.percent)

        this.clear()

        this.ctx.lineWidth = PXSCALE
        this.ctx.fillStyle = this.colors.custom
        this.ctx.strokeStyle = this.colors.custom


        if (this.getProp('pips')) {
            this.ctx.globalAlpha = 0.1
            this.ctx.beginPath()
            this.ctx.rect(margin + 0.5, margin + 0.5, this.width - margin * 2 - 1, this.height - margin * 2 - 1)
            this.ctx.stroke()

            this.ctx.beginPath()
            for (var pip of this.faders.x.rangeKeys.concat(this.faders.x.valueToPercent(this.faders.x.originValue))) {
                if (pip == 0 || pip == 100) continue
                var xpip = Math.round(2 * this.faders.x.percentToCoord(pip)) / 2
                this.ctx.moveTo(xpip, margin + 0.5)
                this.ctx.lineTo(xpip, this.height - margin - 0.5)
            }
            for (pip of this.faders.y.rangeKeys.concat(this.faders.y.valueToPercent(this.faders.y.originValue))) {
                if (pip == 0 || pip == 100) continue
                var ypip = Math.round(2 * this.faders.y.percentToCoord(pip)) / 2
                this.ctx.moveTo(margin + 0.5, ypip)
                this.ctx.lineTo(this.width - margin - 0.5, ypip)
            }
            this.ctx.stroke()

        } else {

            this.clearRect = [x - margin, y - margin, margin * 2, margin * 2]

        }


        this.ctx.globalAlpha = 0.7

        this.ctx.beginPath()
        this.ctx.arc(x, y, pointSize, Math.PI * 2, false)
        this.ctx.stroke()

        this.ctx.globalAlpha = 1
        this.ctx.lineWidth = 1.5 * PXSCALE

        this.ctx.beginPath()
        this.ctx.arc(x, y, pointSize / 1.5, Math.PI * 2, false)
        this.ctx.stroke()

    }

    showValue() {

        if (this.getProp('input')) this.input.setValue(this.value)

    }

    getSplit() {

        return this.getProp('split')?
            typeof this.getProp('split') == 'object' && this.getProp('split').length == 2 ?
                this.getProp('split')
                : [this.getProp('address') + '/x', this.getProp('address') + '/y']
            : false

    }


    onPropChanged(propName, options, oldPropValue) {

        if (super.onPropChanged(...arguments)) return true

        switch (propName) {

            case 'color':
                for (var w of [this.faders.x, this.faders.y]) {
                    w.onPropChanged('color')
                }
                if (this.input) this.input.onPropChanged('color')
                return

        }

    }

    onRemove() {
        this.faders.x.onRemove()
        this.faders.y.onRemove()
        if (this.input) this.input.onRemove()
        super.onRemove()
    }

}
