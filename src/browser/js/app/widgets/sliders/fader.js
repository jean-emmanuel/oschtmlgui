var {clip} = require('../utils'),
    Slider = require('./slider'),
    parser = require('../../parser')

module.exports = class Fader extends Slider {

    static defaults() {

        return super.defaults({

            _fader:'fader',

            horizontal: {type: 'boolean', value: false, help: 'Set to `true` to display the fader horizontally'},
            alignRight: {type: 'boolean', value: false, help: 'Set to `true` to invert the pip\'s and fader\'s position'},
            pips: {type: 'boolean', value: true, help: 'Set to `false` to hide the scale'},
            input: {type: 'boolean', value: true, help: 'Set to `false` to hide the built-in input'},
            meter: {type: 'boolean', value: false, help: [
                'Set to true to display a vu-meter next in the fader',
                '- the meter\'s `id` will be the same as the widget\'s with `/meter` appended to it',
                '- the meter\'s `id` will be the same as the widget\'s with `/meter` appended to it'
            ]},
            compact: {type: 'boolean', value: false, help: 'Set to `true` to display a compact alternative for the widget. Disables default mouse/touch focusing on the value display.'},
            dashed: {type: 'boolean', value: false, help: 'Set to `true` to display a dashed gauge'},
            snap: {type: 'boolean', value: false, help: 'By default, dragging the widget will modify it\'s value starting from its last value. Setting this to `true` will make it snap directly to the mouse/touch position'},
            spring: {type: 'boolean', value: false, help: 'When set to `true`, the widget will go back to its `default` value when released'},
            doubleTap: {type: 'boolean', value: false, help: [
                'Set to `true` to make the fader reset to its `default` value when receiving a double tap.',
                'Can also be an osc address, in which case the widget will just send an osc message (`/<doubleTap> <preArgs>`)'
            ]},
            range: {type: 'object', value: {min:0,max:1}, help: [
                'Defines the breakpoints of the fader\'s scale:',
                '- keys can be percentages and/or `min` / `max`',
                '- values can be `number` or `object` if a custom label is needed',
                'Example: (`{min:{"-inf": 0}, "50%": 0.25, max: {"+inf": 1}}`)'
            ]},
            logScale: {type: 'boolean', value: false, help: 'Set to `true` to use logarithmic scale for the y axis'},
            unit: {type: 'string', value: '', help: 'Unit will be appended to the displayed widget\'s value (it doesn\'t affect osc messages)'},
            origin: {type: 'number', value: 'auto', help: 'Defines the starting point\'s value of the fader\'s gauge'},

        }, [], {

            touchAddress: {type: 'string', value:'', help: 'OSC address for touched state messages: `/touchAddress [preArgs] 0/1`'},
            meterAddress: {type: 'string', value:'', help: 'OSC address for the built-in meter'},
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

        super(options)

        this.widget.classList.add('fader')
        this.margin = 22

        if (this.getProp('horizontal')) {
            this.widget.classList.add('horizontal')
            this.container.classList.add('horizontal')
        }

        if (this.getProp('compact')) {
            this.widget.classList.add('compact')
            this.margin = 0
            if (this.getProp('input')) {
                this.widget.addEventListener('fast-right-click', (e)=>{
                    if (e.detail.button == 2 && !EDITING) {
                        // Mouse only
                        this.input.focus()
                    }
                })
            }
        }

        if (this.getProp('alignRight') && !this.getProp('horizontal')) {
            this.widget.classList.add('align-right')
        }

        if (this.getProp('meter')) {
            var data = {
                type:'meter',
                id: this.getProp('id') + '/meter',
                label:false,
                horizontal:this.getProp('horizontal'),
                range:this.getProp('range'),
                logScale:this.getProp('logScale'),
                address:this.getProp('meterAddress') || this.getProp('address') + '/meter',
                preArgs:this.getProp('preArgs'),
                color:this.getProp('color'),
                pips:false,
                dashed:true
            }
            var meter = parser.parse([data],this.wrapper, this)
            meter.container.classList.add('not-editable')

            this.widget.classList.add('has-meter')
        }

        if (this.getProp('pips')) {

            this.widget.classList.add('has-pips')

            var pips = this.wrapper.appendChild(DOM.create('<div class="pips"></div>'))
            var pipTexts = {}
            for (var k in this.rangeKeys) {
                pipTexts[this.rangeKeys[k]]=this.rangeLabels[k]
            }

            var pipsInner = ''
            for (var i=0;i<=100;i++) {
                if (pipTexts[i]==undefined) continue

                var pos = this.getProp('horizontal')?'left':'bottom'

                var piptext = `<span>${Math.abs(pipTexts[i])>=1000?pipTexts[i]/1000+'k':pipTexts[i]}</span>`

                var add = `
                <div class="pip val" style="${pos}:${i}%">${piptext}</div>
                `
                pipsInner = pipsInner + add
            }
            pips.innerHTML = pipsInner
        }


    }

    draginitHandle(e) {

        super.draginitHandle(...arguments)
        if(Date.now()-this.lastDoubleTap>DOUBLE_TAP_TIME){
            this.percent = clip(this.percent,[0,100])

            if (!(e.traversing || this.getProp('snap'))  || e.ctrlKey) return

            this.percent = this.getProp('horizontal')?
                (e.offsetX - this.margin * PXSCALE) / (this.width - (this.margin * PXSCALE * 2)) * 100:
                (this.height - e.offsetY - this.margin * PXSCALE) / (this.height - (this.margin * PXSCALE * 2)) * 100

            // this.percent = clip(this.percent,[0,100])

            this.setValue(this.percentToValue(this.percent), {send:true,sync:true,dragged:true})
        }
    }

    dragHandle(e, data) {

        super.dragHandle(...arguments)

        this.percent = this.getProp('horizontal')?
            this.percent + ( e.movementX/(this.width - this.margin * PXSCALE * 2)) * 100 / e.inertia:
            this.percent + (-e.movementY/(this.height - this.margin * PXSCALE * 2)) * 100  / e.inertia

        this.setValue(this.percentToValue(this.percent), {send:true,sync:true,dragged:true})

    }

    percentToCoord(percent) {

        if (this.getProp('horizontal')) {
            return clip(percent / 100,[0,1]) * (this.width - 2 * PXSCALE * this.margin) + this.margin * PXSCALE
        } else {
            return (this.height - this.margin * PXSCALE) - clip(percent / 100, [0,1]) * (this.height - 2 * PXSCALE * this.margin)
        }

    }

    resizeHandle(event) {

        var ratio = CANVAS_SCALING * this.scaling

        if (this.getProp('compact') && this.getProp('horizontal')) {
            event.height = 1 / ratio
        }

        super.resizeHandle(event)

        if (this.getProp('horizontal')){
            this.ctx.setTransform(1, 0, 0, 1, 0, 0)
            this.ctx.rotate(-Math.PI/2)
            this.ctx.translate(-this.height * ratio, 0)

            if (ratio != 1) this.ctx.scale(ratio, ratio)
        }

        if (this.getProp('gradient')) {
            var colors = this.getProp('gradient')
            if (Array.isArray(colors) && colors.length > 1) {
                try {
                    var grad = this.ctx.createLinearGradient(0,  this.getProp('horizontal') ? 0 : this.height, 0, this.getProp('horizontal') ? this.width : 0)
                    for (var i in colors) {
                        grad.addColorStop(i / (colors.length - 1), colors[i])
                    }
                    this.colors.gradient = grad
                } catch(err) {
                    this.errors.gradient = err
                }
            }
        }


    }


    draw() {

        var width = this.getProp('horizontal') ? this.height : this.width,
            height = !this.getProp('horizontal') ? this.height : this.width

        var d = Math.round(this.percentToCoord(this.percent)),
            o = Math.round(this.percentToCoord(this.valueToPercent(this.originValue))),
            m = Math.round(this.getProp('horizontal') ? this.height / 2 : this.width / 2)

        var dashed = this.getProp('dashed')

        this.clear()

        if (this.getProp('compact')) {

            this.ctx.globalAlpha = this.colors.gaugeOpacity || (dashed ? .3 : .2)  + 0.2 * Math.abs(d-o) / (d<o?o:height-o)

            this.ctx.strokeStyle = this.colors.gradient || this.colors.gauge
            this.ctx.beginPath()
            this.ctx.moveTo(m, o)
            this.ctx.lineTo(m, d)
            this.ctx.lineWidth = width + 2 * PXSCALE
            if (dashed) this.ctx.setLineDash([PXSCALE, PXSCALE])
            this.ctx.stroke()
            if (dashed) this.ctx.setLineDash([])

            this.ctx.globalAlpha = 1
            this.ctx.beginPath()
            this.ctx.fillStyle = this.colors.knob
            this.ctx.rect(0, Math.min(d, height - PXSCALE), width, PXSCALE)
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
            this.ctx.moveTo(m, o)
            this.ctx.lineTo(m, d)
            if (dashed) this.ctx.setLineDash([PXSCALE, PXSCALE])
            this.ctx.stroke()
            if (dashed) this.ctx.setLineDash([])

            this.ctx.globalAlpha = 1

            this.ctx.beginPath()
            this.ctx.rect(m - 9 * PXSCALE, d - 15 * PXSCALE, 18 * PXSCALE, 30 * PXSCALE)
            this.ctx.lineWidth = PXSCALE
            this.ctx.fillStyle = this.colors.bg
            this.ctx.fill()

            this.ctx.beginPath()
            this.ctx.rect(m - 8 * PXSCALE, d - 14 * PXSCALE, 16 * PXSCALE, 28 * PXSCALE)
            this.ctx.fillStyle = this.colors.raised
            this.ctx.fill()
            this.ctx.lineWidth = PXSCALE

            this.ctx.beginPath()
            this.ctx.rect(m - 7.5 * PXSCALE, d - 13.5 * PXSCALE, 15 * PXSCALE, 27 * PXSCALE)
            this.ctx.lineWidth = PXSCALE
            this.ctx.strokeStyle = this.colors.light
            this.ctx.stroke()

            this.ctx.beginPath()
            this.ctx.rect(m - 8 * PXSCALE, d - 14 * PXSCALE, 16 * PXSCALE, PXSCALE)
            this.ctx.lineWidth = PXSCALE
            this.ctx.fillStyle = this.colors.light
            this.ctx.fill()

            this.ctx.beginPath()
            this.ctx.rect(m - 4 * PXSCALE, d, 8 * PXSCALE, PXSCALE)
            this.ctx.fillStyle = this.colors.knob
            this.ctx.fill()

            this.clearRect = [width / 2 - 11 * PXSCALE, 0, 22 * PXSCALE, height]
        }

    }

}
