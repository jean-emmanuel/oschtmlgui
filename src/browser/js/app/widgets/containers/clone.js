var Container = require('../common/container'),
    widgetManager = require('../../managers/widgets'),
    resize = require('../../events/resize'),
    parser = require('../../parser'),
    {deepCopy} = require('../../utils')

var excludedCloneClasses =  ['widget', 'absolute-position', 'ui-resizable', 'ui-draggable', 'not-editable']

class Clone extends Container {

    static defaults() {

        return super.defaults({

            _clone:'clone',

            widgetId: {type: 'string', value: '', help: '`id` of the widget to clone'},

            _overrides:'overrides',

            props: {type: 'object', value: {}, help: 'Cloned widget\'s properties to override'},

        }, ['label', 'color', 'linkId', '_value', 'default', 'value', '_osc', 'precision', 'address', 'preArgs', 'target', 'bypass'])

    }

    constructor(options) {

        options.props.label = ''
        options.props.variables = '@{parent.variables}'

        super({...options, html: '<div class="clone"></div>'})

        this.cloneLock = false
        this.cloneTarget = null
        this.cloneClass = []

        this.container.classList.add('empty')

        this.getCloneTarget()
        if (this.cloneTarget) this.createClone()

        // global listenner to catch cloneTarget's creation if no target is locked
        widgetManager.on('widget-created', (e)=>{

            if (this.cloneTarget === null) {

                var {id, widget} = e

                if (id === this.getProp('widgetId') && this.isValidCloneTarget(widget)) {

                    this.cloneTarget = widget
                    this.createClone()
                    resize.check(this.container)

                }

            }

        }, {context: this})

    }

    getCloneTarget() {

        // attempt to acquire a cloneTarget if 'widget-created' event has not been catched
        // (the target might have been created before the clone itself)

        const widgets = widgetManager.getWidgetById(this.getProp('widgetId'))
                                   .filter(el=>this.isValidCloneTarget(el))

        if (widgets.length === 0) return
        if (widgets.length === 1) {
            this.cloneTarget = widgets[0]
            return
         }

        // when duplicating clones pointing to an object with a static id,
        // each clone will recreate an object with the same id internally
        // we try to get the original one if there is more than 2 clone pointing to the same id (avoiding cloning the clone)

        function isCreatedByAClone(wi){
            const parent = wi.parent
            return parent && parent.getProp('type') === 'clone'
        }

        this.cloneTarget = widgets[0]
        for (const w of widgets) {
            if (!isCreatedByAClone(w)) {
                this.cloneTarget = w
                break
            }
        }

        // we may want to remove this warning
        if (isCreatedByAClone(this.cloneTarget)) {
            console.warn('no deduped clone found : ',this.getProp('widgetId'))
        }

    }

    isValidCloneTarget(widget) {

        return !(widget.contains(this) || this.contains(widget))

    }

    cleanClone() {

        // don't clean if clone is already empty
        if (!this.children.length) return

        //console.log('clear clone',this.getProp('id'))

        // unregister cloned content
        widgetManager.removeWidgets(this.getAllChildren())

        // clean inner html
        this.widget.innerHTML = ''
        this.container.classList.remove(...this.cloneClass)
        this.container.classList.add('clone-container', 'empty')
        this.cloneClass = []

        // clear event listeners on target
        if (this.cloneTarget) {
            this.cloneTarget.removeEventContext(this)
        }

    }

    createClone() {

        if (this.cloneLock) {
            //console.warn('clone locked',this.id)
            return
        }
        //console.log('create clone',this.getProp('id'))

        this.cloneLock = true

        this.cleanClone()

        this.cloneClass = [...this.cloneTarget.container.classList].filter(i=>excludedCloneClasses.indexOf(i) === -1)
        this.container.classList.remove('empty')
        this.container.classList.add(...this.cloneClass)
        let clonedProps = deepCopy(this.cloneTarget.props)
        var clone = parser.parse({
            data: {...clonedProps, ...this.getProp('props')},
            parentNode: this.widget,
            parent: this
        })
        if (clone.getProp('id') === this.cloneTarget.getProp('id')) {
            widgetManager.trigger('change', [{
                widget: this.cloneTarget,
                id: this.cloneTarget.getProp('id'),
                linkId: this.cloneTarget.getProp('linkId'),
                options: {}
            }])
        }

        for (var w of this.getAllChildren()) {
            w.container.classList.add('not-editable')
        }

        DOM.each(this.widget, '.widget', (el)=>{el.classList.add('not-editable')})

        // will react to any widget deletion
        // widget-removed are only triggered from the manager from now
        // TODO : we could avoid useless callbacks if widgets were to trigger widget-removed events
        if(this.cloneTarget){
            this.cloneTarget.on(`prop-changed.${this.hash}`,(e)=>{
                let {id, props,widget, options} = e;
                const equivalentObj = this.findClonedFromWidget(widget)
                if(equivalentObj){
                    for(var p of props){
                        equivalentObj.setProp(p.propName,widget.getProp(p.propName),'cloneChange')
                    }
                    equivalentObj.applyPropChanges('cloneChange')
                }
            })

            // this.cloneTarget.on(`widget-removed.${this.hash}`, (e)=>{
            //     var { widget} = e
            //     // a clone should not react on its target's nested clones widgets
            //     // this mechanism is handled by the inner clones
            //     function containsNonCloned(self,wi){
            //         let insp = wi.parent;
            //         while(insp && insp.parent!==widgetManager){
            //             if(insp===self){return true}
            //             if(insp.cachedProps.type==="clone"){return false}
            //             insp = insp.parent
            //         }
            //         return false
            //     }
            //     if(this.cloneTarget && (this.cloneTarget===widget || containsNonCloned(this.cloneTarget,widget))){
            //     this.cloneTarget.off(`widget-removed.${this.hash}`)
            //     this.cleanClone()
            //     this.cloneTarget = null
            //     const wasChild = this.cloneTarget!==widget


            //     }


        // listen for cloneTarget's deletion
        // if it is just edited, its recreation will be catched by the global 'widget-created' event handler
        this.cloneTarget.on('widget-removed', (e)=>{
            if (this.cloneTarget === e.widget) {
                this.cloneTarget = null
                this.cleanClone()
            }
        }, {context: this})

        // listen for cloneTarget's content updates
        this.cloneTarget.on('widget-created', (e)=>{

            var {widget} = e,
                parent = widget.parent

            while (parent !== this.cloneTarget && parent !== widgetManager) {
                // if updated widget is in a nested clone, ignore it:
                // it will be handled by the nested clone that targets it
                if (parent.getProp('type') === 'clone') return
                parent = parent.parent
            }

            this.createClone()
            resize.check(this.container)

        }, {context: this})

        this.cloneLock = false

    }
    findClonedFromWidget(widget){
        if(!this.cloneTarget)return 

        if(widget===this.cloneTarget){return this.cloneTarget}
        let insp = widget;
        let address = []
        while(insp && insp.parent!==widgetManager){
            if(insp===this.cloneTarget){break}
            // if(insp.cachedProps.type==="clone" ){return null}
            address.push(insp.getProp('id'))
            insp = insp.parent
        }

        if(insp===this.cloneTarget){
            insp = this.children[0]
           for(var i  of address){
            insp = insp.children.find(e=>e.getProp('id')===i)
            if(!insp)break
           }
           return  insp
        }
        

    }
    onPropChanged(propName, options, oldPropValue) {

        if (super.onPropChanged(...arguments)) return true

        switch (propName) {

            case 'widgetId':
                this.cleanClone()
                this.cloneTarget = null
                this.getCloneTarget()
                if (this.cloneTarget) this.createClone()
                return

        }

    }

    onRemove(){

        if (this.cloneTarget) {
            this.cloneTarget.removeEventContext(this)
        }

        super.onRemove()

    }

}

Clone.dynamicProps = Clone.prototype.constructor.dynamicProps.concat(
    'widgetId'
)

module.exports = Clone
