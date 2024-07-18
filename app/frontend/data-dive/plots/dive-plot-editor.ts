import { PartTag } from "tuff-core/parts"
import {ModalPart} from "../../terrier/modals"
import {DiveEditorState} from "../dives/dive-editor"
import {UnpersistedDdDivePlot} from "../gen/models"
import {TerrierFormFields} from "../../terrier/forms"

export type DivePlotEditorState = DiveEditorState & {
    plot: UnpersistedDdDivePlot
}



export default class DivePlotEditor extends ModalPart<DivePlotEditorState> {

    fields!: TerrierFormFields<UnpersistedDdDivePlot>

    async init() {
        this.setTitle("Dive Plot")
        this.setIcon("hub-plot")

        this.fields = new TerrierFormFields<UnpersistedDdDivePlot>(this, this.state.plot)
    }

    renderContent(parent: PartTag): void {
        parent.div(".tt-flex.column.padded.gap", mainColumn => {
            this.fields.compoundField(mainColumn, field => {
                field.label(".required").text("Title")
                this.fields.textInput(field, 'title')
            })
        })
    }

}