var loopProtect = require('loop-protect'),
    {deepCopy} = require('../utils')

class Vm {

    constructor() {

        this.sandbox = document.createElement('iframe')
        this.sandbox.style.display = 'none'
        this.sandbox.sandbox = 'allow-same-origin'

        // attach sandbox
        document.documentElement.appendChild(this.sandbox)

        // sandboxed function prototype
        this.safeFunctionProto = this.sandbox.contentWindow.Function

        // block requests
        this.sandbox.contentWindow.document.open()
        this.sandbox.contentWindow.document.write('<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-eval\';">')
        this.sandbox.contentWindow.document.close()

        // init infinite loop guard
        loopProtect.alias = '__protect'
        loopProtect.hit = function(line){
            throw 'Potential infinite loop found on line ' + line
        }
        this.sandbox.contentWindow.__protect = loopProtect

        // global context
        this.registerGlobals()

        // detach sandbox
        document.documentElement.appendChild(this.sandbox)

    }

    registerGlobals() {

        this.sandbox.contentWindow.console = console
        this.sandbox.contentWindow.setTimeout =
        this.sandbox.contentWindow.setInterval = ()=>{
            throw 'setTimeout and setInterval can\'t be used in the JS sandbox'
        }
        this.sandbox.contentWindow.globals = {
            screen: {width: screen.width, height: screen.height},
            env: deepCopy(ENV),
            url: document.location.host,
            platform: navigator.platform
        }

        // sanitize globals
        for (var imports of ['__protect', 'console', 'setTimeout', 'setInterval', 'globals']) {
            this.sanitize(this.sandbox.contentWindow[imports])
        }

    }

    sanitize(object) {

        // non-primitives created outside the sandbox context can leak
        // the host window object... let's nuke that !
        // (we only nuke functions and objects/arrays because we don't pass anything else)
        var t = typeof o
        if (t === 'function' || (t === 'object' && o !== null)) {
            if (o.__proto__) {
                if (t === 'function') {
                    o.__proto__.constructor = this.safeFunctionProto
                } else {
                    o.__proto__.constructor.constructor = this.safeFunctionProto
                }
            }
            for (var k in o) {
                this.sanitize(o[k])
            }
        }

    }

    compile(code, defaultContext) {

        // var contextInit = 'var locals = locals;',
        var contextInit = '',
            contextKeys = ['__VARS'],
            contextValues = [{}]

        if  (defaultContext) {
            for (var k in defaultContext) {
                contextInit += `var ${k} = ${k} === undefined ? ${JSON.stringify(defaultContext[k])} : ${k};`
                contextKeys.push(k)
                contextValues.push(defaultContext[k])
            }
        }

        var compiledCode = new this.safeFunctionProto(
            ...contextKeys, 'locals',
            loopProtect('"use strict";' + contextInit + code)
                .replace(/;\n(if \(__protect.*break;)\n/g, ';$1') // prevent loop protect from breaking stack linenumber
                .replace(/(VAR_[0-9]+)/g, '__VARS.$1')
        )


        return (context, locals)=>{

            var __contextValues = deepCopy(contextValues)
            var __VARS = __contextValues[0]
            for (var k in context) {
                var index = contextKeys.indexOf(k)
                if (index !== -1) {
                    __contextValues[index] = context[k]
                } else {
                    __VARS[k] = context[k]
                }
            }

            __contextValues.push(locals)

            this.sanitize(__contextValues)

            return compiledCode.apply(null, __contextValues)

        }

    }

}

module.exports = Vm
