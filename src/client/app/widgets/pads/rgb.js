var Pad = require('./pad'),
    Xy = require('./xy'),
    Fader = require('./_fake_fader'),
    {clip, hsbToRgb, rgbToHsb} = require('../utils'),
    Input = require('../inputs/input'),
    html = require('nanohtml')

var faderDefaults = Fader.defaults()._props(),
    xyDefaults = Xy.defaults()._props()

module.exports = class Rgb extends Pad {

    static defaults() {

        return super.defaults({

            _rgb:'rgb',

            snap: {type: 'boolean', value: false, help: [
                'By default, the points are dragged from their initial position.',
                'If set to `true`, touching anywhere on the widget\'s surface will make them snap to the touching coordinates',
            ]},
            spring: {type: 'boolean', value: false, help: 'When set to `true`, the widget will go back to its default value when released'},
            range: {type: 'object', value: {min: 0, max: 255}, help: 'Defines the widget\'s output scale.'},
            input: {type: 'boolean', value: true, help: 'Set to `false` to hide the built-in input widget'},
            useAlpha:{type:'boolean',value:true,help:'add alpha channel'}

        }, ['color'], {

            split: {type: 'boolean|object', value: false, help: [
                'Set to `true` to send separate osc messages for for r and g & b. The address will be the same as the widget\'s with `/r`, `/g` or `/b` appended to it',
                'Can be set as an `object` to specify a different address : `[\'/r\', \'/g\', \'b\']`',
                'Note: the widget will only respond to its original osc address, not to the splitted version'
            ]}
        })

    }

    constructor(options) {

        options.props.pointSize = 10

        super(options)

        this.hueWrapper = this.widget.appendChild(html`<div class="hue-wrapper"></div>`)

        this.hue = new Fader({props:{
            ...faderDefaults,
            id:'h',
            compact:true,
            pips:false,
            horizontal:true,
            snap:this.getProp('snap'),
            range:{min:0,max:360},
            input:false,
            precision:2
        }, cancelDraw: false, parent: this})
        this.hue.margin = this.pointSize
        this.hue.sendValue = ()=>{}
        this.hueWrapper.appendChild(this.hue.widget)
        if (this.getProp('useAlpha')) {
            this.alphaWrapper = this.widget.appendChild(html`<div class="alpha-wrapper"></div>`)

            this.alpha = new Fader({props:{
                ...faderDefaults,
                id:'a',
                compact:true,
                pips:false,
                horizontal:true,
                snap:this.getProp('snap'),
                range:{min:0,max:255},
                input:false,
                precision:2
            }, cancelDraw: false, parent: this})
            this.alpha.setValue(255)
            this.alpha.margin = this.pointSize
            this.alpha.sendValue = ()=>{}
            this.alphaWrapper.appendChild(this.alpha.widget)
            this.alphaValue = 255

            this.alpha.on('change',(e)=>{
                e.stopPropagation = true
                this.dragHandle(true)
            })
        }
        this.pad = new Xy({props:{
            ...xyDefaults,
            snap:this.getProp('snap'),
            spring:this.getProp('spring'),
            rangeX:{min:0,max:100},
            rangeY:{min:0,max:100},
            precision:2,
            pointSize: this.getProp('pointSize'),
            pips: false,
            input:false
        }, parent: this})
        this.pad.sendValue = ()=>{}
        this.wrapper.appendChild(this.pad.widget)


        this.value = []
        this.hsb = {h:0,s:0,b:0}


        this.hue.on('change',(e)=>{
            e.stopPropagation = true
            this.dragHandle(true)
        })
        

        this.pad.on('change',(e)=>{
            e.stopPropagation = true
            this.dragHandle()
        })

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
        if(this.getProp('useAlpha')){
            this.setValue([this.getProp('range').min, this.getProp('range').min, this.getProp('range').min,this.getProp('range').min])
        }
        else{
            this.setValue([this.getProp('range').min, this.getProp('range').min, this.getProp('range').min])
        }
        

    }

    dragHandle(hue) {
        var h = this.hue.value,
            s = this.pad.value[0],
            b = this.pad.value[1],
            useAlpha = this.getProp('useAlpha'),
            a = useAlpha?this.alpha.value:255
        

        if (h != this.hsb.h ||s != this.hsb.s || b != this.hsb.b || (useAlpha && a!=this.alphaValue)) {

            this.hsb.h = this.hue.value
            this.hsb.s = this.pad.value[0]
            this.hsb.b = this.pad.value[1]
            if(useAlpha)
                this.alphaValue = a

            this.update({nohue:!hue})

            var rgb = hsbToRgb(this.hsb),
                {min, max} = this.getProp('range')

            if (min !== 0 || max !== 255) {
                for (var k in rgb) {
                    rgb[k] = min + max * rgb[k] / 255
                }
                if(useAlpha){
                    a = min+max*a/255
                }
            }
            var toSend = [rgb.r, rgb.g, rgb.b]
            if(useAlpha){
                toSend.push(a)
            }
            
            if (rgb.r != this.value[0] || rgb.g != this.value[1] || rgb.b != this.value[2] || (useAlpha && a!=this.value[3])) {
                this.setValue(toSend,{send:true,sync:true,dragged:true,nohue:!hue})
            }
        }

    }

    setValue(v, options={}) {
        var useAlpha = this.getProp('useAlpha')
        if (!v || !v.length || (v.length!=3 && v.length!=4) ) return
        if (this.touched && !options.dragged) return this.setValueTouchedQueue = [v, options]


        for (let i in [0,1,2]) {
            v[i] = clip(v[i],[this.getProp('range').min, this.getProp('range').max])
        }

        var rgb = {r:v[0],g:v[1],b:v[2]},
            {min, max} = this.getProp('range')

        if(useAlpha){
            v[3] = clip(v[3],[this.getProp('range').min, this.getProp('range').max])
            rgb.a = v[3]
        }
        if (min !== 0 || max !== 255) {
            for (var k in rgb) {
                rgb[k] = (rgb[k] - min ) * 255 / max
            }
        }

        var hsb = rgbToHsb(rgb)

        if (!options.dragged) {
            this.pad.setValue([hsb.s, hsb.b], {sync: false, send:false, dragged:false})
        }

        this.hsb = hsb
        this.value = v

        if (options.send) this.sendValue()
        if (options.sync) this.changed(options)

        this.update({dragged:options.dragged, nohue:options.nohue || (v[0]==v[1]&&v[1]==v[2])})

    }

    update(options={}) {

        if (!options.nohue && !options.dragged) {
            var hue = hsbToRgb({h:this.hsb.h,s:100,b:100}),
                hueStr = `rgb(${Math.round(hue.r)},${Math.round(hue.g)},${Math.round(hue.b)})`
            this.canvas.setAttribute('style',`background-color:${hueStr}`)
            this.hue.setValue(this.hsb.h, {sync: false, send:false, dragged:false})
        }


        this.showValue()

    }

    draw() {}

    showValue() {

        if (this.getProp('input')) this.input.setValue(this.value)

    }

    getSplit() {

        return this.getProp('split')?
                typeof this.getProp('split') == 'object' && this.getProp('split').length == 3 ?
                this.getProp('split')
                : [this.getProp('address') + '/r', this.getProp('address') + '/g', this.getProp('address') + '/b']
                : false

    }

    onPropChanged(propName, options, oldPropValue) {

        if (super.onPropChanged(...arguments)) return true

        switch (propName) {

            case 'color':
                for (var w of [this.hue, this.pad]) {
                    w.onPropChanged('color')
                }
                if (this.input) this.input.onPropChanged('color')
                return

        }

    }

    onRemove() {
        this.hue.onRemove()
        this.pad.onRemove()
        if (this.input) this.input.onRemove()
        super.onRemove()
    }

}
