var Pad = require('./pad'),
    Xy = require('./xy'),
    {clip} = require('../utils'),
    touchstate = require('../mixins/touch_state')


var xyDefaults = Xy.defaults()._props()


module.exports = class MultiXy extends Pad {

    static defaults() {

        return super.defaults({

            _mutlixy: 'multi xy',

            points: {type: 'integer|array', value: 2, help: [
                'Defines the number of points on the pad',
                'Can be an array of strings that will be used as labels for the points (ex: `[\'A\', \'B\']`)'
            ]},


            _xy: 'xy',

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
            logScaleY: {type: 'boolean', value: false, help: 'Set to `true` to use logarithmic scale for the y axis (log10)'}

        }, [], {

            touchAddress: {type: 'string', value:'', help: 'OSC address for touched state messages: `/touchAddress [preArgs] 0/1`'},
            split: {type: 'boolean|object', value: false, help: [
                'Set to `true` to send separate osc messages for each point\'s x and y axis. The address will be the same as the widget\'s with `/N/x` or `/N/y` appended to it, where N is the point\'s id (or the point\'s label if points is an array)',
                'Can be set as an `object` to specify a different address : `[\'/0/x\', \'/0/y\', \'/1/x\', \'/2/y\']`',
                'Note: the widget will only respond to its original osc address, not to the splitted version'
            ]}
        })

    }

    constructor(options) {

        super(options)

        this.npoints = typeof this.getProp('points') == 'object' ? this.getProp('points').length : this.getProp('points')
        this.labels = typeof this.getProp('points') == 'object'
        this.pointSize = parseInt(this.getProp('pointSize'))

        this.pads = []

        for (let i=this.npoints-1;i>=0;i--) {
            this.pads[i] = new Xy({props:{
                ...xyDefaults,
                snap:this.getProp('snap'),
                spring:this.getProp('spring'),
                default:this.getProp('default').length === this.getProp('points') * 2 ? [this.getProp('default')[i*2], this.getProp('default')[i*2 + 1]] : '',
                rangeX:this.getProp('rangeX'),
                rangeY:this.getProp('rangeY'),
                precision:this.precision,
                logScaleX:this.getProp('logScaleX'),
                logScaleY:this.getProp('logScaleY'),
                pointSize: this.getProp('pointSize'),
                pips: this.getProp('pips') && i == this.npoints-1,
                input:false
            }, parent: this})
            this.pads[i].sendValue = ()=>{}
            this.wrapper.appendChild(this.pads[i].widget)

        }


        this.value = []

        this.padsCoords = []
        this.touchMap = {}

        touchstate(this, {element: this.wrapper, multitouch: true})

        this.on('draginit',(e)=>{

            var id

            if (!this.touchMap[e.pointerId]) {

                var ndiff, diff = -1

                for (var i in this.pads) {

                    if (Object.values(this.touchMap).indexOf(i) != -1) continue

                    ndiff = Math.abs(e.offsetX -  this.padsCoords[i][0]) + Math.abs(e.offsetY - (this.padsCoords[i][1] + this.height))

                    if (diff == -1 || ndiff < diff) {
                        id = i
                        diff = ndiff
                    }

                }

                this.touchMap[e.pointerId] = id


            }

            if (!id) return

            e.stopPropagation = true

            this.pads[id].trigger('draginit', e)

        }, false, {element: this.wrapper, multitouch: true})

        this.on('drag',(e)=>{

            var i = this.touchMap[e.pointerId]

            this.pads[i].trigger('drag', e)

        }, false, {element: this.wrapper[0], multitouch: true})

        this.on('dragend',(e)=>{

            var i = this.touchMap[e.pointerId]

            e.stopPropagation = true

            this.pads[i].trigger('dragend', e)

            delete this.touchMap[e.pointerId]

        }, false, {element: this.wrapper, multitouch: true})

        this.on('change',(e)=>{
            if (e.widget == this) return
            e.stopPropagation = true
            this.setValue(this.getValue(), e.options)
        })


        var v = []
        for (let i = 0; i < this.npoints * 2; i = i + 2) {
            [v[i],v[i+1]]  = this.pads[i/2].getValue()
        }

        this.setValue(v)

    }

    resizeHandle() {

        super.resizeHandle(...arguments)
        this.updateHandlesPosition()

    }

    updateHandlesPosition() {

        for (var i=0;i<this.npoints;i++) {

            this.padsCoords[i] = [clip(this.pads[i].faders.x.percent,[0,100]) / 100 * (this.width - (this.pointSize * 2 + 2) * PXSCALE) + (this.pointSize + 1) * PXSCALE
                ,- clip(this.pads[i].faders.y.percent,[0,100]) / 100 * (this.height - (this.pointSize * 2 + 2) * PXSCALE) - (this.pointSize + 1) * PXSCALE]

        }

    }

    draw() {

        this.clear()

        for (var i=0;i<this.npoints;i++) {
            var margin = (this.pointSize + 1) * PXSCALE,
                x = clip(this.pads[i].faders.x.percent,[0,100]) / 100 * (this.width - 2 * margin) + margin,
                y = (100 - clip(this.pads[i].faders.y.percent,[0,100])) / 100 * (this.height - 2 * margin) + margin,
                t = (this.labels ? this.getProp('points')[i] : i) + '',
                length = this.fontSize * t.length

            this.ctx.globalAlpha = 1
            this.ctx.fillStyle = this.colors.text
            this.ctx.fillText(t, x + 0.5 * PXSCALE, y + 0.5 * PXSCALE)

            this.clearRect[i] = [x - length / 2, y - this.fontSize / 2, length, this.fontSize + 2 * PXSCALE]

        }

    }

    getValue() {

        var v = []
        for (var i=0;i<this.pads.length * 2;i=i+2) {
            [v[i],v[i+1]] = this.pads[i/2].getValue()
        }
        return v

    }

    setValue(v, options={}) {

        if (!v || !v.length || v.length!=this.npoints * 2) return
        if (this.touched && !options.dragged) return this.setValueTouchedQueue = [v, options]

        for (let i=0;i<this.npoints;i++) {
            if (!options.dragged) {
                this.pads[i].setValue([v[i*2],v[i*2+1]])
            }
        }

        this.updateHandlesPosition()
        this.batchDraw()

        for (let i=0;i<this.npoints * 2;i=i+2) {
            [this.value[i],this.value[i+1]]  = this.pads[i/2].getValue()
        }

        if (options.send) this.sendValue()
        if (options.sync) this.changed(options)

    }

    getSplit() {

        return this.getProp('split')?
            typeof this.getProp('split') == 'object' && this.getProp('split').length == 2 * this.npoints ?
                this.getProp('split')
                : (()=>{
                    var s={},
                        t
                    for (var i=0; i<this.npoints * 2;i=i+2) {
                        t = this.labels ? this.getProp('points')[i/2] : i/2
                        s[i]=this.getProp('address') + '/' + t + '/x'
                        s[i+1]=this.getProp('address') + '/' + t + '/y'
                    }
                    return s
                })()
            : false

    }

    onPropChanged(propName, options, oldPropValue) {

        if (super.onPropChanged(...arguments)) return true

        switch (propName) {

            case 'color':
                for (var w of this.pads) {
                    w.onPropChanged('color')
                }
                return

        }

    }

    onRemove() {
        for (var i in this.pads) {
            this.pads[i].onRemove()
        }
        super.onRemove()
    }

}
