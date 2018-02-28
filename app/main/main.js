var settings = require('./settings')

var serverStarted

if (process.title === 'node') {
    process.on('uncaughtException', (err)=>{
        console.error('A JavaScript error occurred in the main process:')
        console.trace(err)
    })
} else {
    require('electron').dialog.showErrorBox = (title, err)=>{
        console.error(title + ': ' + err)
    }
}

var start = function(readyApp) {

    if (!settings.read('guiOnly') && !serverStarted) {

        var server = require('./server'),
            osc = require('./osc'),
            callbacks = require('./callbacks')

        server.bindCallbacks(callbacks)

        serverStarted = true
        process.on('exit',()=>{
            if (osc.midi) osc.midi.stop()
        })

    }

    if (!settings.read('noGui')) {

        var app = require('./electron-app')
        var address = typeof settings.read('guiOnly')=='string'? 'http://' + settings.read('guiOnly') : settings.read('appAddresses')[0]
        address += settings.read('urlOptions')

        var launch = ()=>{
            var win = require('./electron-window')({address:address, shortcuts:true, fullscreen: settings.read('fullScreen')})
            return win
        }
        if (app.isReady()) {
            return launch()
        } else {
            app.on('ready',function(){
                launch()
            })
        }
    }

}



if (settings.cli) {

    start()

} else {

    var app = require('./electron-app'),
        path = require('path'),
        address = 'file://' + path.resolve(__dirname + '/launcher/' + 'index.html'),
        {ipcMain} = require('electron'),
        launcher

    app.on('ready',function(){
        launcher = require('./electron-window')({address:address, shortcuts:false, width:680, height:750, node:true, color:'#283143'})
    })

    if (process.log) {
        process.log = (function(write) {
            return function(string, encoding, fd) {
                write.apply(process, arguments)
                launcher.webContents.send('stdout', string)
            }
        })(process.log)
    }

    process.stdout.write = (function(write) {
        return function(string, encoding, fd) {
            write.apply(process.stdout, arguments)
            launcher.webContents.send('stdout', string)
        }
    })(process.stdout.write)

    process.stderr.write = (function(write) {
        return function(string, encoding, fd) {
            write.apply(process.stdout, arguments)
            launcher.webContents.send('stderr', string)
        }
    })(process.stderr.write)


    ipcMain.on('start',function(e, options){

        var gui = start()

        if (settings.read('guiOnly')) {
            launcher.hide()
            gui.on('close',()=>{
                launcher.close()
            })
        } else {
            launcher.webContents.send('started')
        }


    })


}
