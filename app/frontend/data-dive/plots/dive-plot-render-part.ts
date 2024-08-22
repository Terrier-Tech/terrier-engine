import TerrierPart from "../../terrier/parts/terrier-part"
import {PartTag} from "tuff-core/parts"
import {DivePlotEditorState} from "./dive-plot-editor"
import {UnpersistedDdDivePlot} from "../gen/models"
import Queries, {QueryResult} from "../queries/queries"
import {Logger} from "tuff-core/logging"
import Arrays from "tuff-core/arrays"
import {PlotPart} from "tuff-plot/part"
import DivePlotLayouts from "./dive-plot-layouts"
import DivePlotTraces from "./dive-plot-traces"
import DiveEditor from "../dives/dive-editor";

const log = new Logger("DivePlotRenderPart")

export type DivePlotRenderState = DivePlotEditorState & {
    plot: UnpersistedDdDivePlot
}

/**
 * Actually renders a dive plot.
 */
export default class DivePlotRenderPart extends TerrierPart<DivePlotRenderState> {

    previewData: Record<string,QueryResult> = {}

    plotPart!: PlotPart

    async init() {

        this.plotPart = this.makePart(PlotPart, {layout: {}, traces: []})


        this.listenMessage(DiveEditor.diveChangedKey, _ => {
            log.info("Dive changed, reloading plot")
            this.reload().then()
        }, {attach: 'passive'})

        await this.reload()
    }

    relayout() {
        if (this.plotPart) {
            log.info(`Relayouting plot`, this)
            // convert the layout to its tuff-plot equivalents
            this.plotPart.state.layout = DivePlotLayouts.toPlotLayout(this.state.plot.layout)

            // convert the traces to tuff-plot traces
            if (this.previewData) {
                this.plotPart.state.traces = Arrays.compact(this.state.plot.traces.map(t => {
                    const queryResult = this.previewData[t.query_id]
                    if (queryResult == null) {
                        return null
                    }
                    return DivePlotTraces.toPlotTrace(t, queryResult)
                }))
                log.info(`Generated ${this.plotPart.state.traces.length} traces`, this.plotPart.state.traces)
            }

            // force the plot to update its layout
            this.plotPart.relayout()
        }
    }

    async reload() {
        // determine which queries are needed
        const queryIds = Arrays.unique(this.state.plot.traces.map(t => t.query_id))
        if (!queryIds.length) {
            return
        }
        const queries = this.state.dive.query_data?.queries.filter(q => queryIds.includes(q.id)) || []

        // get the preview data
        log.info(`Generating preview for queries`, queries)
        this.startLoading()
        for (const query of queries) {
            this.previewData[query.id] = await Queries.preview(query)
        }

        this.stopLoading()
        this.relayout()
    }

    get parentClasses(): Array<string> {
        return ['dd-dive-plot-render']
    }

    render(parent: PartTag) {
        parent.part(this.plotPart)
    }
}