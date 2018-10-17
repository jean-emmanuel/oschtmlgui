var {clip, mapToScale} = require('../utils'),
    Canvas = require('../common/canvas'),
    touchstate = require('../mixins/touch_state'),
    doubletab = require('../mixins/double_tap'),
    Input = require('../inputs/input')

class Slider extends Canvas {

    constructor(options) {

        var html = `
            <div class="slider">
                <div class="wrapper">
                    <canvas></canvas>
                </div>
            </div>
        `

        super({...options, html: html})

        this.wrapper = DOM.get(this.widget, '.wrapper')[0]

        this.value = undefined
        this.percent = 0

        this.unit = this.getProp('unit') ? ' ' + this.getProp('unit') : ''


        this.rangeKeys = []
        this.rangeVals = []
        this.rangeLabels = []

        for (var k in this.getProp('range')) {
            var key = k=='min'?0:k=='max'?100:parseInt(k),
                val = typeof this.getProp('range')[k] == 'object'?
                    this.getProp('range')[k][Object.keys(this.getProp('range')[k])[0]]:
                    this.getProp('range')[k],
                label = typeof this.getProp('range')[k] == 'object'?
                    Object.keys(this.getProp('range')[k])[0]:
                    val

            this.rangeKeys.push(key)
            this.rangeVals.push(val)
            this.rangeLabels.push(label)
        }
        this.rangeValsMax = Math.max(...this.rangeVals),
        this.rangeValsMin = Math.min(...this.rangeVals)

        this.originValue = this.getProp('origin')=='auto'?
            this.rangeValsMin:
            clip(this.getProp('origin'), [this.rangeValsMin,this.rangeValsMax])

        this.springValue = this.getProp('default') !== '' ? this.getProp('default') :  this.originValue

        if (this.getProp('doubleTap')) {

            if (typeof this.getProp('doubleTap') === 'string' && this.getProp('doubleTap')[0] === '/') {

                doubletab(this.widget, ()=>{
                    this.sendValue({v:null, address: this.getProp('doubleTap')})
                })

            } else {

                doubletab(this.widget, ()=>{
                    this.setValue(this.springValue,{sync:true, send:true, fromLocal:true})
                })

            }

        }


        this.wrapper.addEventListener('mousewheel',this.mousewheelHandleProxy.bind(this))

        this.on('draginit', this.draginitHandleProxy.bind(this), {element:this.wrapper})
        this.on('drag', this.dragHandleProxy.bind(this), {element:this.wrapper})
        this.on('dragend', this.dragendHandleProxy.bind(this), {element:this.wrapper})

        touchstate(this, {element: this.wrapper})


        if (this.getProp('input')) {

            this.input = new Input({
                props:{
                    ...Input.defaults()._props(),
                    precision:this.getProp('precision'),
                    unit:this.getProp('unit'),
                    vertical: this.getProp('type') == 'fader' && this.getProp('compact') && !this.getProp('horizontal')
                },
                parent:this, parentNode:this.widget
            })

            this.widget.appendChild(this.input.widget)
            this.input.on('change', (e)=>{
                e.stopPropagation = true
                this.setValue(this.input.getValue(), {sync:true, send:true})
                this.showValue()
            })

        }

        this.setValue(this.springValue)

    }

    mousewheelHandleProxy() {

        this.mousewheelHandle(...arguments)

    }

    draginitHandleProxy() {

        this.draginitHandle(...arguments)

    }

    dragHandleProxy() {

        this.dragHandle(...arguments)

    }

    dragendHandleProxy() {

        this.dragendHandle(...arguments)

    }

    mousewheelHandle(e) {

        if (e.wheelDeltaX) return

        e.preventDefault()
        e.stopPropagation()

        var direction = e.wheelDelta / Math.abs(e.wheelDelta),
            increment = e.ctrlKey?0.25:1

        this.percent = clip(this.percent +  Math.max(increment,10/Math.pow(10,this.precision + 1)) * direction, [0,100])

        this.setValue(this.percentToValue(this.percent), {sync:true,send:true,dragged:true})

    }

    draginitHandle(e, data, traversing) {

    }

    dragHandle(e, data, traversing) {

    }

    dragendHandle(e, data, traversing) {

        if (this.getProp('spring')) {
            this.setValue(this.springValue,{sync:true,send:true,fromLocal:true})
        }

    }

    cacheCanvasStyle(style) {

        style = style || window.getComputedStyle(this.canvas)

        super.cacheCanvasStyle(style)

        this.colors.gauge = style.getPropertyValue('--color-gauge') || this.colors.custom
        this.colors.knob = style.getPropertyValue('--color-knob') || this.colors.custom
        this.colors.pips = style.getPropertyValue('--color-pips') || this.colors.custom
        this.colors.gaugeOpacity = style.getPropertyValue('--gauge-opacity')


    }


    percentToValue(percent) {

        var h = clip(percent,[0,100])
        for (var i=0;i<this.rangeKeys.length-1;i++) {
            if (h <= this.rangeKeys[i+1] && h >= this.rangeKeys[i]) {
                return mapToScale(h,[this.rangeKeys[i],this.rangeKeys[i+1]],[this.rangeVals[i],this.rangeVals[i+1]],false,this.getProp('logScale'))
            }
        }

    }

    valueToPercent(value) {

        for (var i=0;i<this.rangeVals.length-1;i++) {
            if (
                (this.rangeVals[i+1] > this.rangeVals[i] && value <= this.rangeVals[i+1] && value >= this.rangeVals[i]) ||
                (this.rangeVals[i+1] < this.rangeVals[i] && value >= this.rangeVals[i+1] && value <= this.rangeVals[i])
            ) {
                return mapToScale(value,[this.rangeVals[i],this.rangeVals[i+1]],[this.rangeKeys[i],this.rangeKeys[i+1]],false,this.getProp('logScale'),true)
            }
        }

    }

    setValue(v,options={}) {

        if (typeof v != 'number') return
        if (this.touched && !options.dragged) return this.setValueTouchedQueue = [v, options]

        var value = clip(v,[this.rangeValsMin,this.rangeValsMax])

        if ((options.dragged || options.fromLocal) && this.value.toFixed(this.precision) == value.toFixed(this.precision)) options.send = false

        this.value = value

        if (!options.dragged) this.percent = this.valueToPercent(this.value)

        if (!this.noDraw) this.batchDraw()

        this.showValue()

        if (options.send) this.sendValue()
        if (options.sync) this.changed(options)

    }

    showValue() {

        if (this.getProp('input')) this.input.setValue(this.value)

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
        if (this.input) this.input.onRemove()
        super.onRemove()
    }

}

Slider.dynamicProps = Slider.prototype.constructor.dynamicProps.concat(
    'on',
    'off'
)

module.exports = Slider
