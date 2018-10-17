var Widget = require('./widget')

class CanvasQueue {

    constructor() {

        this.queue = {}
        this.flushed = 0
        this.running = false
        this.frameLength = 1000 / CANVAS_FRAMERATE
        this.lastFrame = 0
        this.bindedLoop = this.loop.bind(this)

    }

    push(widget) {

        this.queue[widget.hash] = widget
        this.flushed = 0

        if (!this.running) {
            this.running = true
            requestAnimationFrame(this.bindedLoop)
        }

    }

    flush() {

        for (var h in this.queue) {
            this.queue[h].draw()
        }

        this.queue = {}
        this.flushed++

    }

    loop(timestamp) {

        if (this.flushed >= 10) {
            this.running = false
            return
        }

        requestAnimationFrame(this.bindedLoop)

        var delta = timestamp - this.lastFrame

        if (delta > this.frameLength) {
            this.lastFrame = timestamp - (delta % this.frameLength)
            this.flush()
        }

    }

}

var canvasQueue = new CanvasQueue()


class Canvas extends Widget {

    constructor(options) {

        super(options)

        this.canvas = DOM.get(this.widget, 'canvas')[0]
        this.ctx = this.canvas.getContext('2d')

        this.height = undefined
        this.width = undefined
        this.scaling = 1

        this.clearRect = []

        this.visible = false

        this.colors = {}

        this.on('resize', this.resizeHandleProxy.bind(this), {element: this.canvas})

        this.ctx.arc = (x, y, r, s, e, c)=>{

            CanvasRenderingContext2D.prototype.arc.call(this.ctx, x, y, Math.max(0,r), s, e, c)

        }

    }

    resizeHandleProxy() {

        this.resizeHandle(...arguments)

    }

    resizeHandle(event){

        var {width, height, style} = event,
            ratio = CANVAS_SCALING * this.scaling

        this.height = height
        this.width = width

        this.canvas.setAttribute('width', width * ratio)
        this.canvas.setAttribute('height', height * ratio)

        this.clearRect = []

        if (ratio != 1) {
            this.ctx.setTransform(1, 0, 0, 1, 0, 0)
            this.ctx.scale(ratio, ratio)
        }

        this.cacheCanvasStyle(style)

        if (!this.visible) this.visible = true

        requestAnimationFrame(this.draw.bind(this))

    }

    cacheCanvasStyle(style){

        style = style || window.getComputedStyle(this.canvas)

        this.colors.custom = style.getPropertyValue('--color-custom')
        this.colors.track = style.getPropertyValue('--color-track')
        this.colors.text = style.getPropertyValue('--color-text')
        this.colors.raised = style.getPropertyValue('--color-raised')
        this.colors.bg = style.getPropertyValue('--color-bg')
        this.colors.fg = style.getPropertyValue('--color-fg')
        this.colors.faded = style.getPropertyValue('--color-faded')
        this.colors.light = style.getPropertyValue('--color-light')

        this.fontFamily = style.getPropertyValue('font-family')
        this.textAlign = style.getPropertyValue('text-align')
        this.fontSize = parseFloat(style.getPropertyValue('font-size'))
        this.fontWeight = parseFloat(style.getPropertyValue('font-weight'))

        this.ctx.font = this.fontWeight + ' ' + this.fontSize + 'px ' + this.fontFamily
        this.ctx.textBaseline = 'middle'
        this.ctx.textAlign = this.textAlign

    }

    clear() {

        if (!this.clearRect.length) {
            this.ctx.clearRect(0, 0, this.width, this.height)
            return
        }

        if (typeof this.clearRect[0] == 'object') {
            for (let i in this.clearRect) {
                this.ctx.clearRect(...this.clearRect[i])
            }
            return
        }

        this.ctx.clearRect(...this.clearRect)

    }

    batchDraw() {

        if (this.visible) canvasQueue.push(this)

    }

    draw(){
        throw new Error('Calling unimplemented draw() method')
    }

    onPropChanged(propName, options, oldPropValue) {

        var ret = super.onPropChanged(...arguments)

        switch (propName) {

            case 'color':
                this.cacheCanvasStyle()
                this.batchDraw()
                return

        }

        return ret


    }

    onRemove() {
        this.off('resize')
        super.onRemove()
    }

}

Canvas.dynamicProps = Canvas.prototype.constructor.dynamicProps.concat(
    'on',
    'off'
)

module.exports = Canvas
