import { PartTag } from "tuff-core/parts"
import {ModalPart} from "../../terrier/modals"
import {DiveEditorState} from "../dives/dive-editor"
import {UnpersistedDdDivePlot} from "../gen/models"
import {TerrierFormFields} from "../../terrier/forms"
import {DivePlotTrace} from "./dive-plots"
import Messages from "tuff-core/messages"
import {Logger} from "tuff-core/logging"
import DivePlotList from "./dive-plot-list"
import Db from "../dd-db"
import DivePlotRenderPart from "./dive-plot-render-part"

const log = new Logger("DivePlotList")

export type DivePlotEditorState = DiveEditorState & {
    plot: UnpersistedDdDivePlot
}



export default class DivePlotEditor extends ModalPart<DivePlotEditorState> {

    plot!: UnpersistedDdDivePlot
    fields!: TerrierFormFields<UnpersistedDdDivePlot>
    traces: DivePlotTrace[] = []
    renderPart!: DivePlotRenderPart
    saveKey = Messages.untypedKey()

    async init() {
        this.plot = this.state.plot

        if (this.plot.id?.length) {
            this.setTitle("Edit Dive Plot")
        }
        else {
            this.setTitle("New Dive Plot")
        }
        this.setIcon("hub-plot")

        this.fields = new TerrierFormFields<UnpersistedDdDivePlot>(this, this.plot)

        this.traces = this.plot.traces || []

        this.renderPart = this.makePart(DivePlotRenderPart, this.state)

        this.addAction({
            title: "Save",
            icon: "hub-checkmark",
            click: {key: this.saveKey}
        })

        this.onClick(this.saveKey, _ => {
            log.debug("Saving plot", this.plot)
            this.save()
        })
    }

    renderContent(parent: PartTag): void {
        parent.div(".tt-flex.column.padded.gap", mainColumn => {
            this.fields.compoundField(mainColumn, field => {
                field.label(".required").text("Title")
                this.fields.textInput(field, 'title')
            })

            mainColumn.part(this.renderPart)

            mainColumn.h3(".glyp-items").text("Traces")

        })
    }

    async save() {
        const plotData = await this.fields.serialize()
        const plot = {...this.plot, title: plotData.title}
        log.info("Saving plot", plot)

        const res = await Db().upsert('dd_dive_plot', plot)
        if (res.status == 'success') {
            this.state.plot = res.record
            this.emitMessage(DivePlotList.reloadKey, {})
            this.successToast("Successfully Saved Plot")
            return this.pop()
        }

        // errors
        log.warn("Error saving plot", res)
        this.alertToast(res.message)

    }
}


