import TerrierPart from "../../terrier/parts/terrier-part"
import {DiveEditorState} from "../dives/dive-editor"
import {PartTag} from "tuff-core/parts"
import {DdDivePlot, UnpersistedDdDivePlot} from "../gen/models"
import DivePlots from "./dive-plots"
import Fragments from "../../terrier/fragments"
import Messages from "tuff-core/messages"
import {Logger} from "tuff-core/logging"
import DivePlotEditor from "./dive-plot-editor";

const log = new Logger("DivePlotList")

export default class DivePlotList extends TerrierPart<DiveEditorState> {

    newKey = Messages.untypedKey()
    reloadKey = Messages.untypedKey()

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

        this.listenMessage(this.reloadKey, _ => {
            log.debug("Reload Plot List")

        })

        this.dirty()
    }

    async reload() {
        this.plots = await DivePlots.get(this.state.dive)
    }

    render(parent: PartTag): any {
        parent.h3().text(`${this.plots.length} Plots`)

        Fragments.button(parent, this.theme, "New Plot", "hub-plus", "secondary")
            .emitClick(this.newKey)
    }

}