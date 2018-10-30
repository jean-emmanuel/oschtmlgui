var build = require('./build'),
    path = require('path'),
    babelify = require('babelify'),
    nanohtml = require('nanohtml'),
    watch = process.argv.includes('--watch'),
    prod = process.argv.includes('--prod'),
    through = require('through'),
    minimatch = require('minimatch').Minimatch


var ignores = ['**/*.min.js', '**/jquery.ui.js', 'gyronorm.complete.min.js'],
    transformWrapper = function(transform){
        return function(file, opts){
             if (ignores.some(pattern => minimatch(pattern).match(file))) {
                return through()
            } else {
                return transform(file, opts)
            }
        }
    }

var transforms = [
    [transformWrapper(babelify)],
    [transformWrapper(nanohtml)]
]

if (prod) {
    console.warn('\033[36m=> Building minified client bundle, this may take a while...\033[0m')
    transforms.push([transformWrapper(require('uglifyify')), {global: true}])
}

var bundle = build({
    input: '../src/client/index.js',
    output: '../app/client/open-stage-control-client.js',
    options: {
        debug: true,
        insertGlobals: false,
        noParse: ['**/*.min.js', '**/jquery.ui.js'],
        cache: {},
        packageCache: {}
    },
    plugins: watch ? [require('watchify')] : [],
    transforms: transforms
})

if (watch) {

    var ansiHTML = require('ansi-html'),
        WS = require('../node_modules/ws')

    function send(msg, data){
        var ipc = new WS('ws://127.0.0.1:8080/dev')
        ipc.on('error', ()=>{})
        ipc.on('open', ()=>{
            ipc.send(JSON.stringify([msg, data]))
            ipc.close()
        })
    }

    bundle.b.on('update', hotBundle)
    bundle.b.on('log', function(msg) {console.warn('\x1b[36m%s\x1b[0m', msg)})

    function hotBundle() {

        var output = bundle()

        output.on('end', (err)=> {
            console.log('Build successful reloading...')
            send('reload')
        })

        output.on('error', (err)=> {

            console.error(err.stack)
            send('errorPopup',
                '<div class="error-stack">' +
                    ansiHTML(
                        err.stack
                        .replace(/^    at .*/gm, '') // remove useless stack
                        .replace(new RegExp(path.resolve(__dirname + '/..'), 'g'),'.') // shorten file path
                        .trim()
                        .replace('\n','\n\n') // add 1 new line after 1st line
                    ) +
                '</div>'
            )

        })

    }


    hotBundle()

} else {

    bundle()

}
