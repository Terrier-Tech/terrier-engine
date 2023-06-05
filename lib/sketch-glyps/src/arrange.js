
const artboardSize = 64
const padding = 32
const cellSpan = artboardSize + padding

import sketch from 'sketch'

const groupBy = (x,f)=>x.reduce((a,b)=>((a[f(b)]||=[]).push(b),a),{})

export default function(context) {

    const document = sketch.Document.getSelectedDocument()
    let page = document.selectedPage

    const artboardMap = {}
    for (const layer of page.layers) {
        console.log(`layer ${layer.name}`)
        artboardMap[layer.name] = layer
    }

    let col = 0
    let row = 0
    const names = Object.keys(artboardMap)
    const letterGroups = groupBy(names, (n) => n[0])
    const letters = Object.keys(letterGroups).sort()

    for (const letter of letters) {
        const letterNames = letterGroups[letter].sort()

        const prefixGroups = groupBy(letterNames, (n) => n.split('_')[0])
        const prefixes = Object.keys(prefixGroups).sort()

        if (col) {
            row += 1
        }
        col = 0
        for (const prefix of prefixes) {
            const prefixNames = prefixGroups[prefix]
            const isGroup = prefixNames.length > 2 // there are at least a few, give them their own row
            if (isGroup && col) {
                col = 0
                row += 1
            }
            for (const name of prefixNames.sort()) {
                const x = col * cellSpan
                const y = row * cellSpan
                const artboard = artboardMap[name]
                console.log(`Moving artboard "${name}" to ${x}, ${y}`)
                artboard.frame.x = x
                artboard.frame.y = y
                col += 1
            }
            if (isGroup) {
                col = 0
                row += 1
            }
        }
    }

    sketch.UI.message(`Arranged ${names.length} Glyps!`)
}