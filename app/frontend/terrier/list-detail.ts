import TerrierPart from "./parts/terrier-part"
import {PartTag} from "tuff-core/parts"


export class ListDetailPart extends TerrierPart<any> {
    render(parent: PartTag): any {
        parent.h1().text("List/Detail")
    }

}