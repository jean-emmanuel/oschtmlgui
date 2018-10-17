module.exports = {

    clip: function(value,range) {

        value = parseFloat(value)

        if (isNaN(value)) value = range[0]
        return Math.max(Math.min(range[0],range[1]),Math.min(value,Math.max(range[0],range[1])))

    },

    // map a value from a scale to another input and output must be range arrays
    mapToScale: function(value,rangeIn,rangeOut,precision,log,revertlog) {

        value = module.exports.clip(value,[rangeIn[0],rangeIn[1]])

        value =  log ?
            revertlog ?
                (Math.pow(10,((value-rangeIn[0])/(rangeIn[1]-rangeIn[0])))/9-1/9) * (rangeOut[1]-rangeOut[0]) + rangeOut[0]
                :Math.log10(((value-rangeIn[0])/(rangeIn[1]-rangeIn[0]))*9+1) * (rangeOut[1]-rangeOut[0]) + rangeOut[0]
            :((value-rangeIn[0])/(rangeIn[1]-rangeIn[0])) * (rangeOut[1]-rangeOut[0]) + rangeOut[0]

        value = Math.max(Math.min(rangeOut[0],rangeOut[1]),Math.min(value,Math.max(rangeOut[0],rangeOut[1])))

        if (precision !== false) value = parseFloat(value.toFixed(precision))


        return value

    },

    hsbToRgb: function(hsb) {
        var rgb = {}
        var h = hsb.h
        var s = hsb.s*255/100
        var v = hsb.b*255/100
        if(s == 0) {
            rgb.r = rgb.g = rgb.b = v
        } else {
            var t1 = v
            var t2 = (255-s)*v/255
            var t3 = (t1-t2)*(h%60)/60
            if(h==360) h = 0
            if(h<60) {rgb.r=t1;    rgb.b=t2; rgb.g=t2+t3}
            else if(h<120) {rgb.g=t1; rgb.b=t2;    rgb.r=t1-t3}
            else if(h<180) {rgb.g=t1; rgb.r=t2;    rgb.b=t2+t3}
            else if(h<240) {rgb.b=t1; rgb.r=t2;    rgb.g=t1-t3}
            else if(h<300) {rgb.b=t1; rgb.g=t2;    rgb.r=t2+t3}
            else if(h<360) {rgb.r=t1; rgb.g=t2;    rgb.b=t1-t3}
            else {rgb.r=0; rgb.g=0;    rgb.b=0}
        }
        return rgb
    },

    rgbToHsb: function(rgb) {
        var hsb = {h: 0, s: 0, b: 0}
        var min = Math.min(rgb.r, rgb.g, rgb.b)
        var max = Math.max(rgb.r, rgb.g, rgb.b)
        var delta = max - min
        hsb.b = max
        hsb.s = max != 0 ? 255 * delta / max : 0
        if (hsb.s != 0) {
            if (rgb.r == max) hsb.h = (rgb.g - rgb.b) / delta
            else if (rgb.g == max) hsb.h = 2 + (rgb.b - rgb.r) / delta
            else hsb.h = 4 + (rgb.r - rgb.g) / delta
        } else hsb.h = 0
        hsb.h *= 60
        if (hsb.h < 0) hsb.h += 360
        hsb.s *= 100/255
        hsb.b *= 100/255
        return hsb
    },

    math: (()=>{
        var math = require('mathjs/dist/math.min.js').create({
            matrix: 'Array'
        })
        math.import({
            unpack: function(a) { return Array.isArray(a) ? a.toString() : a },
            pad: function(x, padding) {
                var str = String(x),
                    [int, dec] =  str.split('.')
                while (int.length < padding) {
                    int = '0' + int
                }
                return dec ? int + '.' + dec : int
            },
            length: function(x) { return x.length },
            values: function(x) { return Object.values(x) },
            keys: function(x) { return Object.keys(x) },
            extend: function(x, y) { return Object.assign(x, y) },
            timestamp: function() { return Date.now() },
            // basic relationnal to keep alphabetical string comparison (v4 change)
            equal:     function(a, b) { return a == b },
            unequal:   function(a, b) { return a != b },
            smaller:   function(a, b) { return a < b },
            larger:    function(a, b) { return a > b },
            smallerEq: function(a, b) { return a <= b },
            largerEq:  function(a, b) { return a >= b }
        }, {override:true})

        // set math's parser array index base to zero
        math.expression.mathWithTransform = Object.assign({}, math)

        return math
    })()

}
