import { PartTag } from "tuff-core/parts"
import {ModalPart} from "../../terrier/modals"
import Queries, {Query} from "./queries"
import Messages from "tuff-core/messages"
import SortablePlugin from "tuff-sortable/sortable-plugin"
import {Logger} from "tuff-core/logging"

const log = new Logger("ColumnOrderModal")

export type ColumnOrderState = {
    query: Query
    onSorted: (columns: string[]) => any
}

export default class ColumnOrderModal extends ModalPart<ColumnOrderState> {

    submitKey = Messages.untypedKey()
    columns: string[] = []

    async init() {
        this.setTitle("Column Order")
        this.setIcon("glyp-sort")

        this.addAction({
            title: "Apply",
            icon: "glyp-checkmark",
            click: {key: this.submitKey}
        })

        this.onClick(this.submitKey, _ => {
            this.state.onSorted(this.columns)
            this.pop()
        })

        // initialize the columns from the query, if present
        const query = this.state.query
        if (query.columns?.length) {
            this.columns = query.columns
        }

        // ensure that all columns in the query are represented, regardless of whether they're stored
        Queries.eachColumn(query, (_, col) => {
            const name = col.alias || col.name
            if (!this.columns.includes(name)) {
                this.columns.push(name)
            }
        })

        // make the list sortable
        this.makePlugin(SortablePlugin, {
            zoneClass: 'dive-column-sort-zone',
            targetClass: 'column',
            onSorted: (_, evt) => {
                this.columns = evt.toChildren.map(c => c.dataset.column as string)
                log.info(`On sorted to ${this.columns.join(', ')}`, evt)
            }
        })
    }

    renderContent(parent: PartTag): void {
        parent.div('.tt-flex.column.padded.gap', container => {
            container.p().text("Drag and drop the columns to change their order:")
            container.div(".dive-column-sort-zone", zone => {
                for (const col of this.columns) {
                    zone.div(".column").data({column: col}).text(col)
                }
            })
        })
    }

}