import {AxisType} from "tuff-plot/axis"
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
    {value: 'none', title: 'None'},
    {value: 'number', title: 'Number'},
    {value: 'time', title: 'Date/Time'},
    {value: 'group', title: 'Grouped Bars'},
    {value: 'stack', title: 'Stacked Bars'},
]

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
            const typeDir = this.side == 'bottom' ? 'row' : 'column'
            container.div(`.tt-flex.wrapped.small-gap.${typeDir}`, flex => {
                axisTypeOptions.forEach(option => {
                    if ((this.side == 'bottom' || this.side == 'left') && option.value == 'none') {
                        return // don't let them not have a bottom or left axis
                    }
                    flex.label(".caption-size", label => {
                        this.radio(label, 'type', option.value)
                        label.span().text(option.title)
                    })
                })
            })
        })
    }
}


const DivePlotAxes = {
    axisSides
}
export default DivePlotAxes