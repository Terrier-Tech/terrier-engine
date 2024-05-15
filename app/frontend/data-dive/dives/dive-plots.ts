import TerrierFormPart from "../../terrier/parts/terrier-form-part"
import {DiveEditorState} from "./dive-editor"
import {PartTag} from "tuff-core/parts"


export class DivePlotsForm extends TerrierFormPart<DiveEditorState> {
    render(parent: PartTag): any {
        parent.div().text("Coming Soon")
    }

}