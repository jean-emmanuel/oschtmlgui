var browserify = require('browserify'),
    uglifyify = require('uglifyify'),
    through = require('through'),
    minimatch = require('minimatch').Minimatch,
    licensify = require('licensify'),
    exorcist = require('exorcist'),
    path = require('path'),
    fs         = require('fs'),
    babelify = require('babelify'),
    prod = process.argv.indexOf('--prod') != -1,
    fast = process.argv.indexOf('--fast') != -1,
    watch = process.argv.indexOf('--watch') != -1,
    b

var ignoreList = ['**/*.min.js', '**/jquery.ui.js', '**/socket.io.slim.js'],
    ignoreWrapper = function(transform){
        return function(file, opts){
             if (
                ignoreList.some(function(pattern) {
                    var match = minimatch(pattern)
                    return match.match(file)
                })
            ) {
                return through()
            } else {
                return transform(file, opts)
            }
        }
    }

if (prod) console.warn('\x1b[36m%s\x1b[0m', 'Building minified js bundle for production... This may take a while... ');


var plugins = [licensify]

if(watch){plugins.push(require('watchify'))}

b = browserify(path.resolve(__dirname + '/../src/browser/js/index.js'), 
    {debug:!fast,
    insertGlobals:fast,
    noParse: ignoreList,
    cache: {},// needed by watchify
    packageCache: {},// needed by watchify
    plugin: plugins
 })

b = b.transform(ignoreWrapper(babelify), {presets: ["env"]})
if (prod) b = b.transform(ignoreWrapper(uglifyify), {global: true})

if(watch){
    b.on('update', bundle);
    b.on('log', function (msg) {console.warn(msg);})
}
bundle();


function bundle(){
    var bun =  b.bundle()

    if (!fast)  bun.pipe(exorcist(path.resolve(__dirname + '/../app/browser/scripts.js.map')))

    if(watch){bun.pipe(fs.createWriteStream(path.resolve(__dirname + '/../app/browser/scripts.js')))}
    else{ bun.pipe(process.stdout)}

}

