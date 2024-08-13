import {AxisType, PlotAxis} from "tuff-plot/axis"
import {TerrierFormFields} from "../../terrier/forms"
import {PartTag} from "tuff-core/parts"
import TerrierPart from "../../terrier/parts/terrier-part"
import {DbErrors} from "../../terrier/db-client"
import * as inflection from "inflection"
import DivePlotEditor from "./dive-plot-editor"


// let's not worry about a top axis for now
const axisSides = ['left', 'bottom', 'right'] as const
export type AxisSide = typeof axisSides[number]

// we have some additional axis types that affect the tick format
export type DivePlotAxisType = AxisType | 'dollars' | 'days' | 'months' | 'none'

export type DivePlotAxis = {
    type: DivePlotAxisType
    title: string
    clampToZero?: boolean
}

const leftAxisTypeOptions = [
    {value: 'number', title: 'Number'},
    {value: 'dollars', title: 'Dollars'},
    {value: 'days', title: 'Dates'},
    {value: 'months', title: 'Months'}
]

// only allow vertical bars
const bottomAxisTypeOptions = leftAxisTypeOptions.concat([
    {value: 'group', title: 'Grouped Bars'},
    {value: 'stack', title: 'Stacked Bars'}
])

// the right axis isn't required
const rightAxisTypeOptions = [
    {value: 'none', title: 'None'}
].concat(leftAxisTypeOptions)

const axisTypeOptions = {
    left: leftAxisTypeOptions,
    right: rightAxisTypeOptions,
    bottom: bottomAxisTypeOptions
} as const

/**
 * Fields for a DivePlotAxis.
 */
export class DivePlotAxisFields extends TerrierFormFields<DivePlotAxis> {

    constructor(part: TerrierPart<any>, axis: DivePlotAxis, readonly side: AxisSide, errors?: DbErrors<DivePlotAxis>) {
        super(part, axis, errors)
    }

    render(parent: PartTag) {
        parent.div(`.dd-dive-plot-axis-fields.tt-form.shrink.${this.side}`, container => {
            container.div('.side').text(`${inflection.titleize(this.side)} Axis:`)

            // title
            this.textInput(container, "title", {placeholder: "Title"})
                .emitChange(DivePlotEditor.relayoutKey)

            // type
            const typeOptions = axisTypeOptions[this.side]
            this.select(container, 'type', typeOptions)
                .emitChange(DivePlotEditor.relayoutKey)

            if (this.side == 'left' || this.side == 'right') {
                container.label('.caption-size', label => {
                    this.checkbox(label, 'clampToZero')
                        .emitChange(DivePlotEditor.relayoutKey)
                    label.div().text("Clamp to Zero")
                }).data({tooltip: "Ensure that the axis range includes zero"})

            }
        })
    }
}


/**
 * Convert a DivePlotAxis to a tuff-plot PlotAxis.
 * @param diveAxis
 * @return undefined if the axis type is 'none'
 */
function toPlotAxis(diveAxis: DivePlotAxis): PlotAxis | undefined {
    if (diveAxis.type == 'none') {
        return undefined
    }
    let tickMode: PlotAxis['tickMode'] = 'auto'
    let type: AxisType
    let tickFormat: PlotAxis['tickFormat'] = '0.[0]a'
    let hoverFormat = tickFormat
    switch (diveAxis.type) {
        case 'dollars':
            type = 'number'
            tickFormat = '($0.[0]a)'
            hoverFormat = tickFormat
            break
        case 'days':
            type = 'time'
            tickFormat = 'MM/DD'
            hoverFormat = tickFormat
            break
        case 'months':
            type = 'time'
            tickFormat = 'MMM'
            tickMode = 'months'
            hoverFormat = 'MM/DD' // we probably still want to see days on hover
            break
        default:
            type = diveAxis.type
    }
    return {
        type,
        tickMode,
        tickFormat,
        hoverFormat,
        title: diveAxis.title,
        range: diveAxis.clampToZero ? 'auto_zero' : 'auto',
        tickLength: 6
    }
}


const DivePlotAxes = {
    axisSides,
    toPlotAxis
}
export default DivePlotAxes