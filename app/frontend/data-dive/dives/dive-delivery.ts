import TerrierFormPart from "../../terrier/parts/terrier-form-part"
import {PartTag} from "tuff-core/parts"
import {DiveEditorState} from "./dive-editor"


export class DiveDeliveryForm extends TerrierFormPart<DiveEditorState> {
    render(parent: PartTag): any {
        parent.div().text("Delivery")
    }

}