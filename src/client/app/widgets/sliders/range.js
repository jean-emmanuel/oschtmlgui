var {clip} = require('../utils'),
    Widget = require('../common/widget'),
    Fader = require('./fader'),
    Input = require('../inputs/input'),
    touchstate = require('../mixins/touch_state'),
    html = require('nanohtml')

var faderDefaults = Fader.defaults()._props()

var RangeFader = class RangeFader extends Fader {

    constructor(options) {

        super(options)
        this.cancelDraw = options.cancelDraw

    }

    sendValue() {}

    draginitHandle() {

        this.percent = clip(this.percent,[
            this.valueToPercent(this.rangeValsMin),
            this.valueToPercent(this.rangeValsMax)
        ])

        super.draginitHandle(...arguments)
    }

    draw() {

        if (this.cancelDraw || !this.parent.faders) return

        var width = this.getProp('horizontal') ? this.height : this.width,
            height = !this.getProp('horizontal') ? this.height : this.width

        var d = Math.round(this.percentToCoord(this.valueToPercent(this.parent.faders[this.getProp('horizontal')?0:1].value))),
            d2 = Math.round(this.percentToCoord(this.valueToPercent(this.parent.faders[this.getProp('horizontal')?1:0].value))),
            m = Math.round(this.getProp('horizontal') ? this.height / 2 : this.width / 2)

        var dashed = this.getProp('dashed')

        this.clear()

        if (this.getProp('compact')) {

            this.ctx.globalAlpha = this.colors.gaugeOpacity || (dashed ? .3 : .2)  + 0.2 * Math.abs(d-d2) / height
            this.ctx.strokeStyle = this.colors.gauge
            this.ctx.beginPath()
            this.ctx.moveTo(m, d2)
            this.ctx.lineTo(m, d)
            this.ctx.lineWidth = width + 2 * PXSCALE
            if (dashed) this.ctx.setLineDash([PXSCALE, PXSCALE])
            this.ctx.stroke()
            if (dashed) this.ctx.setLineDash([])

            this.ctx.globalAlpha = 1
            this.ctx.beginPath()
            this.ctx.fillStyle = this.colors.knob
            this.ctx.rect(0, Math.min(d, height - PXSCALE), width, PXSCALE)
            this.ctx.rect(0, Math.min(d2, height - PXSCALE), width, PXSCALE)
            this.ctx.fill()

            this.clearRect = [0, 0, width, height]

        } else {

            this.ctx.lineWidth = 6 * PXSCALE

            this.ctx.beginPath()
            this.ctx.globalAlpha = 1
            this.ctx.strokeStyle = this.colors.light
            this.ctx.moveTo(m, this.margin * PXSCALE - 2 * PXSCALE)
            this.ctx.lineTo(m, height - this.margin * PXSCALE + 2 * PXSCALE)
            this.ctx.stroke()

            this.ctx.lineWidth = 4 * PXSCALE

            this.ctx.beginPath()
            this.ctx.globalAlpha = 1
            this.ctx.strokeStyle = this.colors.bg
            this.ctx.moveTo(m, this.margin * PXSCALE - 1 * PXSCALE)
            this.ctx.lineTo(m, height - this.margin * PXSCALE + 1 * PXSCALE)
            this.ctx.stroke()

            this.ctx.lineWidth = 2 * PXSCALE

            this.ctx.beginPath()
            this.ctx.strokeStyle = this.colors.track
            this.ctx.moveTo(m, this.margin * PXSCALE)
            this.ctx.lineTo(m, height - this.margin * PXSCALE)
            this.ctx.stroke()

            this.ctx.beginPath()
            this.ctx.globalAlpha = 0.7
            this.ctx.strokeStyle = this.colors.gauge
            this.ctx.moveTo(m, d2)
            this.ctx.lineTo(m, d)
            if (dashed) this.ctx.setLineDash([PXSCALE, PXSCALE])
            this.ctx.stroke()
            if (dashed) this.ctx.setLineDash([])

            this.ctx.globalAlpha = 1

            // high knob bg

            this.ctx.beginPath()
            this.ctx.rect(m - 9 * PXSCALE, d - 14 * PXSCALE, 18 * PXSCALE, 16 * PXSCALE)
            this.ctx.lineWidth = PXSCALE
            this.ctx.fillStyle = this.colors.bg
            this.ctx.fill()

            // low knob bg

            this.ctx.beginPath()
            this.ctx.rect(m - 9 * PXSCALE, d2 - PXSCALE, 18 * PXSCALE, 16 * PXSCALE)
            this.ctx.lineWidth = PXSCALE
            this.ctx.fillStyle = this.colors.bg
            this.ctx.fill()

            // high knob

            this.ctx.beginPath()
            this.ctx.rect(m - 8 * PXSCALE, d - 13 * PXSCALE, 16 * PXSCALE, 14 * PXSCALE)
            this.ctx.fillStyle = this.colors.raised
            this.ctx.fill()
            this.ctx.lineWidth = PXSCALE

            this.ctx.beginPath()
            this.ctx.rect(m - 7.5 * PXSCALE, d - 12.5 * PXSCALE, 15 * PXSCALE, 13.5 * PXSCALE)
            this.ctx.lineWidth = PXSCALE
            this.ctx.strokeStyle = this.colors.light
            this.ctx.stroke()

            this.ctx.beginPath()
            this.ctx.rect(m - 8 * PXSCALE, d - 13 * PXSCALE, 16 * PXSCALE, PXSCALE)
            this.ctx.lineWidth = PXSCALE
            this.ctx.fillStyle = this.colors.light
            this.ctx.fill()

            this.ctx.beginPath()
            this.ctx.rect(m - 4 * PXSCALE, d, 8 * PXSCALE, PXSCALE)
            this.ctx.fillStyle = this.colors.knob
            this.ctx.fill()

            // low knob

            this.ctx.beginPath()
            this.ctx.rect(m - 8 * PXSCALE, d2, 16 * PXSCALE, 14 * PXSCALE)
            this.ctx.fillStyle = this.colors.raised
            this.ctx.fill()
            this.ctx.lineWidth = PXSCALE

            this.ctx.beginPath()
            this.ctx.rect(m - 7.5 * PXSCALE, d2, 15 * PXSCALE, 13.5 * PXSCALE)
            this.ctx.lineWidth = PXSCALE
            this.ctx.strokeStyle = this.colors.light
            this.ctx.stroke()

            this.ctx.beginPath()
            this.ctx.rect(m - 4 * PXSCALE, d2, 8 * PXSCALE, PXSCALE)
            this.ctx.fillStyle = this.colors.knob
            this.ctx.fill()



            this.clearRect = [width / 2 - 11 * PXSCALE, 0, 22 * PXSCALE, height]
        }
    }

}


module.exports = class Range extends Widget {

    static defaults() {

        return super.defaults({

            _range:'range',

            range: {type: 'object', value: {min:0,max:1}, help: 'See fader\'s `range`'},
            horizontal: {type: 'boolean', value: false, help: 'See fader\'s `horizontal`'},
            alignRight: {type: 'boolean', value: false, help: 'See fader\'s `alignRight`'},
            input: {type: 'boolean', value: true, help: 'See fader\'s `input`'},
            compact: {type: 'boolean', value: false, help: 'See fader\'s `compact`'},
            pips: {type: 'boolean', value: true, help: 'See fader\'s `pips`'},
            snap: {type: 'boolean', value: false, help: 'See fader\'s `snap`'},
            spring: {type: 'boolean', value: false, help: 'See fader\'s `spring`'},
            logScale: {type: 'boolean', value: false, help: 'See fader\'s `logScale`'},

        }, [], {

            touchAddress: {type: 'string', value: '', help: 'See fader\'s `touchAddress`'},
            split: {type: 'boolean|object', value: false, help: [
                'Set to `true` to send separate osc messages for `low` and `high` handles. The `address` will be the same as the widget\'s with `/low` or `/high` appended to it',
                'Can be set as an object to specify a different `address` : `[\'/osc_address_low\', \'/osc_address_high\']`',
                'Note: the widget will only respond to its original osc address, not to the splitted version'
            ]},
            css: {type: 'string', value: '', help: [
                'Available CSS variables:',
                '- `--color-gauge: color;`',
                '- `--color-knob: color;`',
                '- `--color-pips: color;`',
                '- `--gauge-opacity: number;`'
            ]}

        })

    }

    constructor(options) {

        super({...options, html: html`
            <div class="range">
                <div class="wrapper"></div>
            </div>
        `})

        this.wrapper = DOM.get(this.widget, '.wrapper')[0]

        this.faders = [
            new RangeFader({props:{
                ...faderDefaults,
                compact:this.getProp('compact'),
                pips:false,
                alignRight:false,
                horizontal:this.getProp('horizontal'),
                height:'100%',
                width:'100%',
                default:this.getProp('default').length === 2 ? this.getProp('default')[0] : this.getProp('range').min,
                snap:this.getProp('snap'),
                spring:this.getProp('spring'),
                range:this.getProp('range'),
                origin:'auto',
                precision:this.precision,
                logScale:this.getProp('logScale'),
                input:false
            }, cancelDraw: true, parent: this}),
            new RangeFader({props:{
                ...faderDefaults,
                compact:this.getProp('compact'),
                pips:this.getProp('pips'),
                alignRight:this.getProp('alignRight'),
                horizontal:this.getProp('horizontal'),
                height:'100%',
                width:'100%',
                default:this.getProp('default').length === 2 ? this.getProp('default')[1] : this.getProp('range').max,
                snap:this.getProp('snap'),
                spring:this.getProp('spring'),
                range:this.getProp('range'),
                origin:'auto',
                precision:this.precision,
                logScale:this.getProp('logScale'),
                input:false
            }, cancelDraw: false, parent: this})
        ]

        this.wrapper.appendChild(this.faders[0].widget)
        this.wrapper.appendChild(this.faders[1].widget)

        this.on('change',(e)=>{

            if (e.widget == this) return

            e.stopPropagation = true

            var v = [
                this.faders[0].getValue(),
                this.faders[1].getValue()
            ]

            this.setValue(v, e.options)

        })

        this.touchMap = {}

        touchstate(this, {element: this.wrapper, multitouch: true})

        this.on('draginit',(e)=>{

            var id

            if (!this.touchMap[e.pointerId]) {

                var ndiff, diff = -1

                for (var i in this.faders) {

                    if (Object.values(this.touchMap).indexOf(i) != -1) continue

                    var coord = this.faders[i].percentToCoord(this.faders[i].valueToPercent(this.faders[i].value)) - (this.getProp('horizontal') ? -1 : 1) * (i == 0 ? -20 : 20)

                    ndiff = this.getProp('horizontal')?
                        Math.abs(e.offsetX - coord) :
                        Math.abs(e.offsetY - coord)

                    if (diff == -1 || ndiff < diff) {
                        id = i
                        diff = ndiff
                    }

                }

                this.touchMap[e.pointerId] = id


            } else if (e.traversing) {

                id = this.touchMap[e.pointerId]

            }

            if (!id) return

            e.stopPropagation = true
            this.faders[id].trigger('draginit', e)

        }, false, {element: this.wrapper, multitouch: true})

        this.on('drag',(e)=>{

            var i = this.touchMap[e.pointerId]
            if (e.shiftKey) {
                this.faders[0].trigger('drag', e)
                this.faders[1].trigger('drag', e)
            } else {
                this.faders[i].trigger('drag', e)
            }

        }, false, {element: this.wrapper, multitouch: true})

        this.on('dragend',(e)=>{

            var i = this.touchMap[e.pointerId]
            e.stopPropagation = true
            this.faders[i].trigger('dragend', e)
            delete this.touchMap[e.pointerId]

        }, false, {element: this.wrapper, multitouch: true})

        if (this.getProp('input')) {

            this.input = new Input({
                props:{...Input.defaults()._props(),
                    precision:this.getProp('precision'),
                    unit:this.getProp('unit'),
                    vertical: this.getProp('compact') && !this.getProp('horizontal')
                },
                parent:this, parentNode:this.widget,
            })
            this.widget.appendChild(this.input.widget)
            this.input.on('change', (e)=>{
                e.stopPropagation = true
                this.setValue(this.input.getValue(), {sync:true, send:true})
                this.showValue()
            })

        }


        if (this.getProp('horizontal')) {
            this.widget.classList.add('horizontal')
            this.container.classList.add('horizontal')
        }
        if (this.getProp('alignRight') && !this.getProp('horizontal')) {
            this.widget.classList.add('align-right')
        }
        if (this.getProp('compact')) {
            this.widget.classList.add('compact')
        }
        if (this.getProp('pips')) {
            this.widget.classList.add('has-pips')
        }

        this.setValue([
            this.faders[0].rangeValsMin,
            this.faders[1].rangeValsMax
        ])

    }

    setValue(v, options={}) {
        if (!v || !v.length || v.length!=2) return


        this.faders[0].rangeValsMax = v[1]
        this.faders[1].rangeValsMin = v[0]

        if (!options.dragged) {
            this.faders[0].setValue(v[0])
            this.faders[1].setValue(v[1])
        }

        this.value = [
            this.faders[0].getValue(),
            this.faders[1].getValue()
        ]


        if (options.send) this.sendValue()
        if (options.sync) this.changed(options)

        this.faders[1].batchDraw()

        this.showValue()


    }

    showValue() {

        if (this.getProp('input')) this.input.setValue(this.value)

    }

    getSplit() {

        return this.getProp('split')?
            typeof this.getProp('split') == 'object' && this.getProp('split').length == 2 ?
                this.getProp('split')
                : [this.getProp('address') + '/low', this.getProp('address') + '/high']
            : false

    }

    onPropChanged(propName, options, oldPropValue) {

        if (super.onPropChanged(...arguments)) return true

        switch (propName) {

            case 'color':
                for (var w of this.faders) {
                    w.onPropChanged('color')
                }
                return

        }

    }

    onRemove() {
        this.faders[0].onRemove()
        this.faders[1].onRemove()
        if (this.input) this.input.onRemove()
        super.onRemove()
    }

}
