import TerrierPart from "../../terrier/parts/terrier-part"
import {DiveEditorState} from "../dives/dive-editor"
import {PartTag} from "tuff-core/parts"
import {DdDivePlot, UnpersistedDdDivePlot} from "../gen/models"
import DivePlots from "./dive-plots"
import Fragments from "../../terrier/fragments"
import Messages from "tuff-core/messages"
import {Logger} from "tuff-core/logging"
import DivePlotEditor from "./dive-plot-editor"
import DivePlotRenderPart, {DivePlotRenderState} from "./dive-plot-render-part"

const log = new Logger("DivePlotList")

const editKey = Messages.typedKey<{ id: string }>()

class DivePlotPreview extends TerrierPart<DivePlotRenderState> {

    renderPart!: DivePlotRenderPart

    async init() {
        this.renderPart = this.makePart(DivePlotRenderPart, this.state)
    }

    get parentClasses(): Array<string> {
        return ['dd-dive-plot-preview']
    }

    reload() {
        if (this.renderPart) {
            this.renderPart.reload().then()
        }
    }

    relayout() {
        if (this.renderPart) {
            this.renderPart.relayout()
        }
    }

    render(parent: PartTag) {
        parent.a(".plot-title.tt-flex.gap", title => {
            title.i('.shrink.icon-only.glyp-differential')
            title.div('.text-center.stretch').text(this.state.plot.title)
            title.i('.glyp-settings.shrink.icon-only')
        }).data({tooltip: "Edit this plot"})
            .emitClick(editKey, {id: this.state.plot.id})
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
        return ['dd-dive-plot-list', 'tt-flex', 'column', 'gap', 'dd-dive-tool', 'tt-typography']
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

        this.onClick(editKey, m => {
            const id = m.data.id
            log.info(`Editing plot ${id}`)
            const plot: UnpersistedDdDivePlot | undefined = this.plots.filter(p => p.id === id)[0]
            if (plot) {
                this.app.showModal(DivePlotEditor, {...this.state, plot})
            }
            else {
                log.warn(`Couldn't find a plot with id=${id}`)
            }
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
        this.getCollectionParts("plots").forEach(part => {
            (part as DivePlotPreview).reload()
        })

        this.dirty()
    }

    render(parent: PartTag): any {
        this.renderCollection(parent, "plots")

        Fragments.button(parent, this.theme, "New Plot", "glyp-plus_outline")
            .class('secondary')
            .emitClick(this.newKey)
    }

}