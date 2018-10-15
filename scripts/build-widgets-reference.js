// Dirty browser window shim

document = {
    createElementNS: x=>[],
    addEventListener: ()=>{},
    createRange: ()=>{
        return {
            createContextualFragment:()=>{return {
                firstChild: {
                    querySelectorAll: x=>[]
                }
            }},
            selectNode: ()=>{}
        }
    },
    body: {
        appendChild: ()=>{}
    }
}

window = {
    addEventListener: ()=>{},
    location: {},
    document: document,
    navigator: {
        platform:''
    },
    NodeList: Array,
    WebSocket: Object
}

Object.assign(global, window)

// Required globals

DOM = require('../src/browser/js/app/dom')
DOM.get = x=>[{addEventListener:()=>{}}]
DOM.init()
CANVAS_FRAMERATE = 1
LANG = 'en'

// Here we go

var widgets = require('../src/browser/js/app/widgets'),
    baseClass = require('../src/browser/js/app/widgets/common/widget'),
    base = baseClass.defaults(),
    doc = []


doc.push(`

    ## Generic properties

    | property | type |default | description |
    | --- | --- | --- | --- |`
)

for (var propName in base) {

    var prop = base[propName],
        permalink = propName

    if (propName[0] === '_' && propName !== '_props') {
        doc.push(`
            | <h4 class="thead2" id="${prop}">${prop}<a class="headerlink" href="#${prop}" title="Permanent link">¶</a></h4> ||||`
        )
    }

    if (propName === '_props' || propName[0] === '_') continue

    var help = Array.isArray(prop.help) ? prop.help.join('<br/><br/>').replace(/<br\/>-/g, '-') : prop.help || '',
        dynamic = baseClass.dynamicProps.includes(propName) ? '<i class="dynamic-prop-icon" title="dynamic"></i>' : ''


    doc.push(`
        | <h4 id="${permalink}">${propName}${dynamic}<a class="headerlink" href="#${permalink}" title="Permanent link">¶</a></h4> | \`${prop.type.replace(/\|/g,'\`\\|<br/>\`')}\` | <code>${(JSON.stringify(prop.value, null, '&nbsp;') || '').replace(/\n/g,'<br/>')}</code> | ${help} |`
    )

}


for (var k in widgets.categories) {
    var category = widgets.categories[k]

    doc.push(`

        ## ${k}`
    )

    for (var kk in category) {
        var type = category[kk],
            defaults = widgets.widgets[type].defaults(),
            separator = false


        doc.push(`

            ### ${type}

            | property | type |default | description |
            | --- | --- | --- | --- |`
        )

        for (var propName in defaults) {

            var prop = defaults[propName],
                permalink = type + '_' + propName

            if (propName[0] === '_' && propName !== '_props') {
                if (separator) doc.pop()
                doc.push(`
                    | <h4 class="thead2" id="${type + '_' + prop}">${prop}<a class="headerlink" href="#${type + '_' + prop}" title="Permanent link">¶</a></h4> ||||`
                )
                separator = true
            }

            if (propName === '_props' || propName[0] === '_' || JSON.stringify(prop) == JSON.stringify(base[propName])) continue

            var help = Array.isArray(prop.help) ? prop.help.join('<br/><br/>').replace(/<br\/>-/g, '-') : prop.help || '',
                dynamic = widgets.widgets[type].dynamicProps.includes(propName) ? '<i class="dynamic-prop-icon" title="dynamic"></i>' : ''

            doc.push(`
                | <h4 id="${permalink}">${propName}${dynamic}<a class="headerlink" href="#${permalink}" title="Permanent link">¶</a></h4> | \`${prop.type.replace(/\|/g,'\`\\|<br/>\`')}\` | <code>${(JSON.stringify(prop.value, null, '&nbsp;') || '').replace(/\n/g,'<br/>')}</code> | ${help} |`
            )
            separator = false
        }

        if (separator) doc.pop()

    }
}

doc.push(`\n\n
    <script>
    document.querySelectorAll('.thead2').forEach(function(item){
        item.classList.remove('thead2')
        item.closest('tr').classList.add('thead2')
    })
    </script>
`)

console.log(doc.join('').replace(/^ +/gm,''))
