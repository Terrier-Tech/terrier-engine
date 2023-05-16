import {PartTag} from "tuff-core/parts"
import {ColumnRef} from "./query"

function render(parent: PartTag, col: ColumnRef) {
    if (col.function?.length) {
        parent.div('.name').text(`${col.function}(${col.name})`)
    } else {
        parent.div('.name').text(col.name)
    }
    if (col.alias?.length) {
        parent.div('.alias').text(col.alias)
    }
}

const Columns = {
    render
}

export default Columns