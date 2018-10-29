var EE3 = require('eventemitter3'),
    uuid = require('nanoid/generate')('0123456789abcdefghijklmnopqrstuvwxyABCDEFGHIJKLMNOPQRSTUVWXYZ', 10)

var reconnectInterval = 5000,
    hearbeatInterval = 25000,
    hearbeatTimeout = 5000

class Ipc extends EE3 {

    constructor() {

        super()

        this.socket = null

        this.queue = []

        this.reconnect = undefined

        this.hearbeat = undefined
        this.hearbeatTimeout = undefined
        this.on('pong', ()=>{
            this.hearbeatTimeout = clearTimeout(this.hearbeatTimeout)
        })
        this.on('ping', ()=>{
            this.socket.send('["pong"]')
        })

        this.open()

    }

    init() {

        var callbacks = require('./callbacks')

        for (let i in callbacks) {
            let callback = callbacks[i]
            this.on(i, (data)=>{
                callback(data)
            })
        }

    }

    open() {

        this.socket = new WebSocket('ws://' + window.location.host + '/' + uuid)

        this.socket.onopen = (e)=>{

            this.reconnect = clearInterval(this.reconnect)

            this.hearbeat = setInterval(()=>{
                if (!this.connected()) return
                this.socket.send('["ping"]')
                this.hearbeatTimeout = setTimeout(()=>{
                    if (this.connected()) this.socket.close()
                }, hearbeatTimeout)
            }, hearbeatInterval)

            this.emit('connect')
            this.flush()

        }

        this.socket.onmessage = (e)=>{
            this.receive(e.data)
        }

        this.socket.onclose = this.socket.onerror = ()=>{
            this.close()
        }

    }

    close() {

        this.socket = null

        this.hearbeat = clearInterval(this.hearbeat)
        this.hearbeatTimeout = clearTimeout(this.hearbeatTimeout)
        this.dieTimeout = clearTimeout(this.dieTimeout)

        if (!this.reconnect) {
            this.reconnect = setInterval(()=>{
                this.open()
            }, reconnectInterval)
        }

    }

    connected() {

        return this.socket && this.socket.readyState == this.socket.OPEN

    }

    receive(message) {

        if (typeof message == 'string') {

            var packet = JSON.parse(message)

            if (Array.isArray(packet) && typeof packet[0] == 'string') {

                this.emit(packet[0], packet[1])

            }

        }

    }

    send(event, data) {

        var packet = JSON.stringify([event, data])

        if (this.connected()) {
            this.socket.send(packet)
        } else {
            this.queue.push(packet)
        }

    }

    flush(){

        for (var i in this.queue) {

            if (this.connected()) this.socket.send(this.queue[i])

        }

        this.queue = []

    }

}

var ipc = new Ipc()

module.exports = ipc
