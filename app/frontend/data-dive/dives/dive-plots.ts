import TerrierFormPart from "../../terrier/parts/terrier-form-part"
import {DiveEditorState} from "./dive-editor"
import {PartTag} from "tuff-core/parts"
import {MarkerStyle, TraceStyle, TraceType, YAxisName} from "tuff-plot/trace"
import {PlotLayout} from "tuff-plot/layout"


export type DiveTrace = {
    id: string
    type: TraceType
    title: string
    query_id: string
    x: string
    y: string
    y_axis: YAxisName
    style?: TraceStyle
    marker?: MarkerStyle
}


export type DivePlot = {
    id: string
    title: string
    traces: DiveTrace[]
    layout: PlotLayout
}


export class DivePlotsForm extends TerrierFormPart<DiveEditorState> {
    render(parent: PartTag): any {
        parent.h3(".coming-soon.glyp-developer").text("Coming Soon")
    }

}