module.exports = (element, callback)=>{

    var lastTapTime = 0,
        lastTapX,
        lastTapY

    element.addEventListener('fast-click', (event)=>{

        if (event.capturedByEditor) return

        var tapTime = Date.now(),
            tapLength = tapTime - lastTapTime,
            eventData = event.detail

        if (

            tapLength < DOUBLE_TAP_TIME &&
            Math.abs(lastTapX - eventData.pageX) < 20 &&
            Math.abs(lastTapY - eventData.pageY) < 20

        ) {

            // execute callback at next cycle to ensure draginit events are resolved first
            setTimeout(callback, 0)
            lastTapTime = 0

        } else {

            lastTapTime = tapTime
            lastTapX = eventData.pageX
            lastTapY = eventData.pageY

        }

    })

}
