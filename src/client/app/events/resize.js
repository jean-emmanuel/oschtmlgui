var elements = []

function checkResizes(context, force){
    // Iterate over all elements to which the 'resize' event is bound.
    var resizedElems = [],
        cachedStyles = []
    for (let i = elements.length - 1; i >= 0; i--) {
        var elem = elements[i]

        if (!context.contains(elem)) continue

        var style = window.getComputedStyle(elem),
            width = parseInt(style['width']) - parseInt(style['padding-left']) - parseInt(style['padding-right']),
            height = parseInt(style['height']) - parseInt(style['padding-top']) - parseInt(style['padding-bottom'])

        if (!width || !height) continue

        // If element size has changed since the last time, update the element
        // data store and trigger the 'resize' event.
        if (force || width != elem.resizedataw || height != elem.resizedatah) {
            elem.resizedataw = width
            elem.resizedatah = height
            resizedElems.push(elem)
            cachedStyles.push(style)
        }
    }
    for (let i = resizedElems.length - 1; i >= 0; i--)  {
        resizedElems[i]._resize_widget.trigger('resize', {
            width: resizedElems[i].resizedataw,
            height: resizedElems[i].resizedatah,
            style:cachedStyles[i],
            stopPropagation: true
        })
    }

}

window.addEventListener('resize', ()=>{checkResizes(document)})

module.exports = {

    setup: function(options) {

        if (!options) return
        if (elements.indexOf(options.element) == -1) {
            elements.push(options.element)
            options.element._resize_widget = this
        }

    },
    teardown: function(options) {

        if (!options) return

        if (elements.indexOf(options.element) != -1) {
            elements.splice(elements.indexOf(options.element), 1)
            delete options.element._resize_widget
        }

    },

    check: checkResizes

}
