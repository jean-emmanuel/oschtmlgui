var Widget = require('../common/widget'),
    ipc = require('../../ipc'),
    html = require('nanohtml')

module.exports = class Led extends Widget {

    static defaults() {

        return super.defaults({

            _image:'image',

            size: {type: 'string', value: 'cover', help: 'CSS background-size'},
            position: {type: 'string', value: 'center', help: 'CSS background-position'},
            repeat: {type: 'string', value: 'no-repear', help: 'CSS background-repeat'},
            border: {type: 'boolean', value: true, help: 'Set to `false` to disable the borders and background-color'},
            cache: {type: 'boolean', value: true, help: [
                'Set to false to disable image caching (forces file reload when updating or editing the widget).',
                'When true, sending `reload` to the widget reloads its image without changing its value'
            ]}

        }, ['color', 'target', 'precision', 'bypass'], {

            value: {type: 'string', value: '', help: [
                '- File `url` or `absolute path`',
                '- Base64 encoded image : `data:image/...`'
            ]}

        })

    }

    constructor(options) {

        super({...options, html: html`<div class="image"></div>`})

        if (!this.getProp('border')) this.container.classList.add('noborder')

        this.widget.style.setProperty('background-size', this.getProp('size'))
        this.widget.style.setProperty('background-position', this.getProp('position'))
        this.widget.style.setProperty('background-repeat', this.getProp('repeat'))

        if (this.getProp('stream') !== '') {
            ipc.on('video', this.onStreamUpdate, this)
        }

    }

    setValue(v, options={}) {

        var s = v==null ? '' : '' + v,
            cache_query = ''

        if (!s.length) {

            this.value = this.getProp('value')

        } else if (s != 'reload') {

            if (s.length > 1) this.value = s

        }

        if (typeof this.value === 'string' && this.value.length) {

            cache_query = this.getProp('cache') || this.value.indexOf('base64') != -1 ?
                '' : (this.value.indexOf('?') != -1 ? '&' : '?') + Date.now()

        }

        this.widget.style.setProperty('background-image', `url(${this.value}${cache_query})`)

        if (options.sync) this.changed(options)

    }

    onStreamUpdate(event) {

        var [stream, data] = event
        if (stream === this.getProp('stream')) {
            this.setValue('data:image/jpeg;base64,' + data)
        }

    }

    onRemove() {

        if (this.bindedOnStreamUpdate) ipc.off('video', this.bindedOnStreamUpdate)
        super.onRemove()

    }

}
