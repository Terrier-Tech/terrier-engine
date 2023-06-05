const fs = require('@skpm/fs')
const childProcess = require('@skpm/child_process')

const numCols = 16
const artboardSize = 64
const padding = 32
const cellSpan = artboardSize + padding

import sketch from 'sketch'

export default function(context) {
    // determine the location of the clypboard-server directory from puma-dev
    const pumaDir = "~/.puma-dev/clypboard-server"
    let clypboardDir = childProcess.execSync(`readlink ${pumaDir}`).toString()
    if (clypboardDir.indexOf('clypboard-server')>-1) {
        clypboardDir = clypboardDir.trim()
        console.log(`Clypboard directory: ${clypboardDir}`)
    }
    else {
        UI.alert('No Clypboard Directory!', `The Glyp plugin assumes that you have a local Clypboard instance that's linked to at ${pumaDir}`)
        return
    }

    const document = sketch.Document.getSelectedDocument()
    let page = document.selectedPage
    if (page) {
        page.name = 'Glyps'
        for (const child of page.layers) {
            child.remove()
        }
    }
    else {
        page = new sketch.Page({
            parent: document,
            name: "Glyps"
        })
    }

    const rootDir = `${clypboardDir}/public/glyp`

    const files = fs.readdirSync(rootDir)
    let col = 0
    let row = 0
    let names = []
    for (const file of files) {
        if (file.endsWith('.svg')) {
            names.push(file)
        }
    }

    for (const file of names.sort()) {
        const x = col * cellSpan
        const y = row * cellSpan
        console.log(`Adding ${file} at ${x},${y}`)

        // create the artboard
        const artboard = new sketch.Artboard({
            parent: page,
            name: file.replace('.svg', ''),
            frame: {
                x: x,
                y: y,
                width: artboardSize,
                height: artboardSize
            },
            exportFormats: [
                {
                    fileFormat: 'svg'
                }
            ]
        })

        // load the svg file
        const svg = fs.readFileSync(`${rootDir}/${file}`)
        const group = sketch.createLayerFromData(svg, 'svg')
        for (const layer of group.layers) {
            layer.frame.x += group.frame.x
            layer.frame.y += group.frame.y
            layer.parent = artboard
        }

        // set the grid
        const grid = MSDefaultGrid.defaultGrid()
        grid.setGridSize(4)
        grid.setThickGridTimes(2)
        grid.setIsEnabled(true)
        artboard.sketchObject.setGrid(grid)

        col += 1
        if (col >= numCols) {
            col = 0
            row += 1
        }
    }


    sketch.UI.message(`Imported ${names.length} Glyps!`)

}