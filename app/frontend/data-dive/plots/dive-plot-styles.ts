import {TerrierFormFields} from "../../terrier/forms"
import {defaultColorPalette, TraceStyle} from "tuff-plot/trace"
import {PartTag} from "tuff-core/parts"
import {titleize} from "inflection"

const previewSize = 64

const namedColors = {
    primary: '#F3A536',
    secondary: '#376177',
    success: '#58AC5C',
    alert: '#D01819',
    gray: '#aaaaaa',
    billing: '#9b59b6',
    pending: '#f1c40f',
    docs: '#0abde3',
    magenta: '#db19ce',
    teal: '#19dbb1',
    burgundy: '#9b0a0a',
    indigo: '#420097'
} as const

// the keys of colors
const colorNames = Object.keys(namedColors)

// the type of colorOptions
export type ColorName = keyof typeof namedColors

/**
 * Use named stroke widths so that we can style them how we want.
 */
const strokeWidths = {
    light: 1,
    medium: 2,
    heavy: 4
} as const

export type StrokeWidthName = keyof typeof strokeWidths


/**
 * Use named dash arrays so that we can style them how we want.
 */
const namedDashArrays = {
    solid: '',
    dashed: '8 8',
    dotted: '2 2'
} as const

export type DashArrayName = keyof typeof namedDashArrays


/**
 * Create a blank style.
 */
function blankStyle(): DivePlotTraceStyle {
    return {colorName: 'default', strokeWidthName: 'medium', strokeDasharrayName: 'solid'}
}


/**
 * Use named values for trace color, stroke width, and dash array.
 */
export type DivePlotTraceStyle = TraceStyle & {
    colorName: ColorName | "default"
    strokeWidthName: StrokeWidthName
    strokeDasharrayName: DashArrayName
}


/// Fields

/**
 * Form fields for editing trace style.
 */
export class TraceStyleFields extends TerrierFormFields<DivePlotTraceStyle> {

    render(parent: PartTag) {
        parent.div('.dd-trace-style-fields.tt-form.tt-flex.gap.mobile-collapsible', container => {
            // color
            container.div(".stretch.tt-flex.column.gap", col => {
                col.h3().text("Color")
                col.label(".default-color.body-size", defaultLabel => {
                    this.radio(defaultLabel, 'colorName', 'default')
                    defaultLabel.div('.color-preview')
                    defaultLabel.div(labels => {
                        labels.div().text("Default (Chosen By Plot Order)")
                        labels.div('.label-size').text("Trace colors use a varying color palette by default, but you can select a specific color for this trace below.")
                    })
                })
                col.div(".color-options", optionsContainer => {
                    for (const [name, color] of Object.entries(namedColors)) {
                        optionsContainer.label('.color-option', label => {
                            this.radio(label, 'colorName', name as ColorName)
                            label.div('.color-preview').css({background: color})
                        }).data({tooltip: titleize(name)})
                    }
                })
            })

            // stroke width
            container.div(".shrink", col => {
                col.h3().text("Stroke Width")
                for (const [name, width] of Object.entries(strokeWidths)) {
                    col.label('.body-size', label => {
                        this.radio(label, 'strokeWidthName', name as StrokeWidthName)
                        label.svg('.stroke-width-preview', svg => {
                            svg.line({
                                x1: 0,
                                x2: previewSize,
                                y1: previewSize / 2,
                                y2: previewSize / 2,
                                strokeWidth: width
                            })
                        }).data({tooltip: titleize(name)})
                    })
                }
            })

            // dash array
            container.div(".shrink", col => {
                col.h3().text("Dashes")
                for (const [name, value] of Object.entries(namedDashArrays)) {
                    col.label('.body-size', label => {
                        this.radio(label, 'strokeDasharrayName', name as DashArrayName)
                        label.svg('.dash-preview', svg => {
                            svg.line({
                                x1: 0,
                                x2: previewSize,
                                y1: previewSize / 2,
                                y2: previewSize / 2,
                                strokeDasharray: value
                            })
                        })
                    }).data({tooltip: titleize(name)})
                }
            })
        })
    }


}


/// Preview

/**
 * Render a preview of the trace style.
 * @param parent
 * @param style
 * @param index
 */
function renderPreview(parent: PartTag, style: DivePlotTraceStyle, index: number) {
    const color = style.colorName === 'default' ? defaultColorPalette[index % defaultColorPalette.length] : namedColors[style.colorName]
    parent.svg('.trace-style-preview', svg => {
        svg.line({
            x1: 0,
            x2: previewSize,
            y1: previewSize / 4,
            y2: previewSize / 4,
            stroke: color,
            strokeWidth: strokeWidths[style.strokeWidthName],
            strokeDasharray: namedDashArrays[style.strokeDasharrayName]
        })
    })
}


/// Conversion

/**
 * Convert a DivePlotTraceStyle to a tuff-plot TraceStyle.
 * @param diveStyle
 */
function toTraceStyle(diveStyle: DivePlotTraceStyle): TraceStyle {
    const tuffStyle: TraceStyle = {
        strokeWidth: strokeWidths[diveStyle.strokeWidthName],
        strokeDasharray: namedDashArrays[diveStyle.strokeDasharrayName]
    }
    if (diveStyle.colorName !== 'default') {
        tuffStyle.stroke = namedColors[diveStyle.colorName]
    }
    return tuffStyle
}


const DivePlotStyles = {
    namedColors,
    colorNames,
    blankStyle,
    renderPreview,
    toTraceStyle
}
export default DivePlotStyles