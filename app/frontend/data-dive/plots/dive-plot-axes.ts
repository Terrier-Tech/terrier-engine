import {AxisType, PlotAxis} from "tuff-plot/axis"
import {TerrierFormFields} from "../../terrier/forms"
import {PartTag} from "tuff-core/parts"
import TerrierPart from "../../terrier/parts/terrier-part"
import {DbErrors} from "../../terrier/db-client"
import * as inflection from "inflection"


// let's not worry about a top axis for now
const axisSides = ['left', 'bottom', 'right'] as const
export type AxisSide = typeof axisSides[number]

export type DivePlotAxisType = AxisType | 'none'

export type DivePlotAxis = {
    type: DivePlotAxisType
    title: string
}

const axisTypeOptions = [
    {value: 'number', title: 'Number'},
    {value: 'time', title: 'Date/Time'},
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

            // type
            const typeOptions = this.side == 'right' ? rightAxisTypeOptions : axisTypeOptions
            this.select(container, 'type', typeOptions)
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
    return {
        type: diveAxis.type,
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