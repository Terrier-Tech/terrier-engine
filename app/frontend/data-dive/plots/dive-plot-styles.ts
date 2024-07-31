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

const colorOptions = []

const strokeWidthOptions = [
    1, 2, 4, 6
]

const dashArrayOptions = [
    {
        value: "",
        label: 'Solid'
    },
    {
        value: "8 8",
        title: "Dashed"
    },
    {
        value: "2 2",
        title: "Dotted"
    }
]

/**
 * Form fields for editing trace style.
 */
export class TraceStyleFields extends TerrierFormFields<TraceStyle> {

    render(parent: PartTag) {
        parent.div('.dd-trace-style-fields.tt-form.tt-flex.gap.wrap', container => {
            this.compoundField(container, field => {
                field.label().text("Color")
                this.colorInput(field, 'stroke', {placeholder: 'Color'})
            })

            // stroke width
            container.div(".shrink", col => {
                col.h3().text("Stroke Width")
                for (const width of strokeWidthOptions) {
                    col.label('.body-size', label => {
                        this.radio(label, 'strokeWidth', width)
                        label.svg('.stroke-width-preview', svg => {
                            svg.line({
                                x1: 0,
                                x2: previewSize,
                                y1: previewSize / 2,
                                y2: previewSize / 2,
                                strokeWidth: width
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
                        this.radio(label, 'strokeDasharray', option.value)
                        label.svg('.dash-preview', svg => {
                            svg.line({
                                x1: 0,
                                x2: previewSize,
                                y1: previewSize / 2,
                                y2: previewSize / 2,
                                strokeDasharray: option.value
                            })
                        })
                    })
                }
            })
        })
    }


}