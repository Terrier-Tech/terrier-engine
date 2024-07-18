import TerrierPart from "../../terrier/parts/terrier-part"
import {PartTag} from "tuff-core/parts"
import {DivePlotEditorState} from "./dive-plot-editor"
import {UnpersistedDdDivePlot} from "../gen/models"

export type DivePlotRenderState = DivePlotEditorState & {
    plot: UnpersistedDdDivePlot
}

/**
 * Actually renders a dive plot.
 */
export default class DivePlotRenderPart extends TerrierPart<DivePlotRenderState> {


    get parentClasses(): Array<string> {
        return ['dd-dive-plot-render']
    }

    render(parent: PartTag) {
        parent.div().text(`${this.state.plot.title} Render`)
    }
}