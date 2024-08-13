import {AxisType, PlotAxis} from "tuff-plot/axis"
import {TerrierFormFields} from "../../terrier/forms"
import {PartTag} from "tuff-core/parts"
import TerrierPart from "../../terrier/parts/terrier-part"
import {DbErrors} from "../../terrier/db-client"
import * as inflection from "inflection"
import DivePlotEditor from "./dive-plot-editor";


// let's not worry about a top axis for now
const axisSides = ['left', 'bottom', 'right'] as const
export type AxisSide = typeof axisSides[number]

export type DivePlotAxisType = AxisType | 'dollars' | 'days' | 'months' | 'none'

export type DivePlotAxis = {
    type: DivePlotAxisType
    title: string
}

const axisTypeOptions = [
    {value: 'number', title: 'Number'},
    {value: 'dollars', title: 'Dollars'},
    {value: 'days', title: 'Dates'},
    {value: 'months', title: 'Months'},
    {value: 'group', title: 'Grouped Bars'},
    {value: 'stack', title: 'Stacked Bars'},
]

// the right axis isn't required
const rightAxisTypeOptions = axisTypeOptions.concat([
    {value: 'none', title: 'None'}
])

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
            const typeOptions = this.side == 'right' ? rightAxisTypeOptions : axisTypeOptions
            this.select(container, 'type', typeOptions)
                .emitChange(DivePlotEditor.relayoutKey)
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
    let type: AxisType = 'number'
    let tickFormat: PlotAxis['tickFormat'] = '0.[0]a'
    let hoverFormat = '0.[0]a'
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
        range: "auto",
        tickLength: 6
    }
}


const DivePlotAxes = {
    axisSides,
    toPlotAxis
}
export default DivePlotAxes