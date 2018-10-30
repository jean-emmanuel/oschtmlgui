var utils = require('../ui/utils'),
    osc = require('../osc'),
    session = require('../managers/session'),
    widgetManager = require('../managers/widgets'),
    state = require('../managers/state'),
    editor = require('../editor/'),
    locales = require('../locales'),
    {deepCopy} = require('../utils'),
    sidepanel = require('../ui/sidepanel'),
    {TRAVERSING_SAMEWIDGET} = require('../events/utils'),
    raw = require('nanohtml/raw'),
    ipc = require('./')

module.exports = {

    bundle: function(data) {
        for (let i in data) {
            osc.receive(data[i])
        }
    },

    receiveOsc: function(data){
        osc.receive(data)
    },

    connected:function(){
        LOADING.close()
    },

    sessionList: function(data){

        session.list(data)

    },

    sessionOpen: function(data){

        session.open(data)

    },

    sessionNew: function(){

        session.create()

    },

    stateLoad: function(data){

        state.set(data.state, data.send)

    },

    stateSend:function(){
        var p = utils.loading(locales('loading_newclient'))

        setTimeout(function(){

            osc.syncOnly = true
            state.send()
            osc.syncOnly = false

            p.close()
        },150)

    },

    editorDisable: function(data){

        editor.disable(data.permanent)

    },

    error: function(data){
        new utils.Popup({title: raw(utils.icon('exclamation-triangle') + '&nbsp; ' + locales('error')), content: raw(data), closable:true})
    },

    reloadCss: function(){
        var queryString = '?reload=' + Date.now()
        DOM.each(document, 'link[rel="stylesheet"][hot-reload]', (el)=>{
            el.href = el.href.replace(/\?.*|$/, queryString)
        })

        setTimeout(()=>{
            var root = widgetManager.getWidgetById('root')[0]
            if (root) root.reCreateWidget()
        },100)


        GRIDWIDTH =  getComputedStyle(document.documentElement).getPropertyValue('--grid-width')
    },

    readOnly: function(){
        READ_ONLY = true
    },

    reload: function(){

        var id = Math.random(),
            search = location.search,
            query = 'backupId=' + id

        // disable editor's warning
        window.onbeforeunload = null

        if (!session.session.length) {
            window.location.href = window.location.href
            return
        }

        try {

            // store session & state backup
            ipc.send('storeBackup', {
                backupId: id,
                session: session.session,
                state: state.get(),
                history: editor.history,
                historyState: editor.historyState,
                editorEnabled: editor.enabled,
                sidepanelOpened: document.getElementById('sidepanel').classList.contains('sidepanel-open'),
                traversing: document.getElementById('container')._traversing
            })

            // reload page and hold backup id

            if (search) {
                if (search.includes('backupId=')) {
                    search = search.replace(/backupId=[^&]*/, query)
                } else {
                    search += '&' + query
                }
            } else {
                search += '?' + query
            }

            window.location.search = search

        } catch(e) {

            window.location.href = window.location.href

        }

    },

    loadBackup: function(data) {

        session.load(data.session, ()=>{

            state.set(data.state, false)

            editor.historySession = deepCopy(data.session)
            editor.history = data.history
            editor.historyState = data.historyState
            if (data.editorEnabled) editor.enable()

            if (data.sidepanelOpened) sidepanel.open()

            if (data.traversing === TRAVERSING_SAMEWIDGET) {
                DOM.get('.traversingSmart')[0].click()
            } else if (data.traversing) {
                DOM.get('.traversingEnable')[0].click()
            }

            ipc.send('deleteBackup', data.backupId)

        })

    }

}
