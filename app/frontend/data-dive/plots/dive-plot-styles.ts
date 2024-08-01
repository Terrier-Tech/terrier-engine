import {TerrierFormFields} from "../../terrier/forms"
import {TraceStyle} from "tuff-plot/trace"
import {PartTag} from "tuff-core/parts"

const previewSize = 64

const namedColors = {
    primary: '#F3A536',
    secondary: '#376177',
    success: '#58AC5C',
    alert: '#D01819',
    gray: '#aaaaaa',
    sense: '#8e44ad',
    billing: '#9b59b6',
    warn: '#e67e22',
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
export type ColorName = keyof typeof colorNames

/**
 * Use named stroke widths so that we can style them how we want.
 */
const strokeWidths = {
    light: 1,
    medium: 2,
    heavy: 4
} as const

const strokeWidthOptions = Object.entries(strokeWidths).map(([value, title]) => {
    return {value, title}
})

export type StrokeWidthName = keyof typeof strokeWidths

/**
 * Use named dash arrays so that we can style them how we want.
 */
const namedDashArrays = {
    solid: '',
    dashed: '8 8',
    dotted: '2 2'
} as const

const dashArrayOptions = Object.entries(namedDashArrays).map(([value, title]) => {
    return {value, title}
})

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

/**
 * Form fields for editing trace style.
 */
export class TraceStyleFields extends TerrierFormFields<DivePlotTraceStyle> {

    render(parent: PartTag) {
        parent.div('.dd-trace-style-fields.tt-form.tt-flex.gap.wrap', container => {
            this.compoundField(container, field => {
                field.label().text("Color")
                this.colorInput(field, 'stroke', {placeholder: 'Color'})
            })

            // stroke width
            container.div(".shrink", col => {
                col.h3().text("Stroke Width")
                for (const option of strokeWidthOptions) {
                    col.label('.body-size', label => {
                        this.radio(label, 'strokeWidthName', option.value)
                        label.svg('.stroke-width-preview', svg => {
                            svg.line({
                                x1: 0,
                                x2: previewSize,
                                y1: previewSize / 2,
                                y2: previewSize / 2,
                                strokeWidth: option.title
                            })
                        })
                    })
                }
            })

            // dash array
            container.div(".shrink", col => {
                col.h3().text("Dashes")
                for (const option of dashArrayOptions) {
                    col.label('.body-size', label => {
                        this.radio(label, 'strokeDasharrayName', option.value)
                        label.svg('.dash-preview', svg => {
                            svg.line({
                                x1: 0,
                                x2: previewSize,
                                y1: previewSize / 2,
                                y2: previewSize / 2,
                                strokeDasharray: option.title
                            })
                        })
                    })
                }
            })
        })
    }


}


const DivePlotStyles = {
    namedColors,
    colorNames,
    blankStyle
}
export default DivePlotStyles