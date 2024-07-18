import TerrierPart from "../../terrier/parts/terrier-part"
import {DiveEditorState} from "../dives/dive-editor"
import {PartTag} from "tuff-core/parts"
import {DdDivePlot, UnpersistedDdDivePlot} from "../gen/models"
import DivePlots from "./dive-plots"
import Fragments from "../../terrier/fragments"
import Messages from "tuff-core/messages"
import {Logger} from "tuff-core/logging"
import DivePlotEditor from "./dive-plot-editor"
import * as inflection from "inflection"
import DivePlotRenderPart, {DivePlotRenderState} from "./dive-plot-render-part"

const log = new Logger("DivePlotList")

class DivePlotPreview extends TerrierPart<DivePlotRenderState> {

    renderPart!: DivePlotRenderPart

    async init() {
        this.renderPart = this.makePart(DivePlotRenderPart, this.state)
    }

    get parentClasses(): Array<string> {
        return ['dd-dive-plot-preview']
    }

    render(parent: PartTag) {
        parent.div(".title").text(this.state.plot.title)
        parent.part(this.renderPart)
    }
}

/**
 * A list of plots.
 */
export default class DivePlotList extends TerrierPart<DiveEditorState> {

    newKey = Messages.untypedKey()
    static reloadKey = Messages.untypedKey()

    plots!: DdDivePlot[]

    get parentClasses(): Array<string> {
        return ['tt-flex', 'column', 'gap', 'dd-dive-tool', 'tt-typography']
    }

    async init() {
        await this.reload()

        this.onClick(this.newKey, _ => {
            log.debug("New Plot")
            const plot: UnpersistedDdDivePlot = {
                title: this.state.dive.name,
                dd_dive_id: this.state.dive.id,
                layout: {},
                traces: []
            }
            this.app.showModal(DivePlotEditor, {...this.state, plot})
        })

        this.listenMessage(DivePlotList.reloadKey, _ => {
            log.info("Reloading...")
            this.reload().then(() => {
                log.info("Reloaded from an external message")
            })
        }, {attach: 'passive'})

        this.dirty()
    }

    async reload() {
        log.info("Reloading")
        this.plots = await DivePlots.get(this.state.dive)

        const plotStates = this.plots.map((plot) => {return {...this.state, plot}})
        this.assignCollection("plots", DivePlotPreview, plotStates)

        this.dirty()
    }

    render(parent: PartTag): any {
        parent.h3().text(`${this.plots.length} ${inflection.inflect('Plot', this.plots.length)}`)

        this.renderCollection(parent, "plots")

        Fragments.button(parent, this.theme, "New Plot", "hub-plus", "secondary")
            .emitClick(this.newKey)
    }

}