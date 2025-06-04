import { ModalPart } from "../../terrier/modals"
import Columns from "./columns"
import Queries, { OrderBy, Query } from "./queries"
import Messages from "tuff-core/messages"
import { PartTag } from "tuff-core/parts"
import { optionsForSelect, SelectOption } from "tuff-core/forms"
import { Logger } from "tuff-core/logging"
import Forms from "../../terrier/forms"
import SortablePlugin from "tuff-sortable/sortable-plugin";

const log = new Logger("RowOrderModal")

export type RowOrderState = {
    query: Query
    onSorted: (orderBys: OrderBy[]) => any
}

export default class RowOrderModal extends ModalPart<RowOrderState> {

    submitKey = Messages.untypedKey()
    newClauseKey = Messages.untypedKey()
    changedKey = Messages.untypedKey()
    orderBys: OrderBy[] = []
    columnOptions: SelectOption[] = []
    removeClauseKey = Messages.typedKey<{ index: number }>()

    async init() {
        this.setTitle("Row Order")
        this.setIcon("glyp-sort")

        this.addAction({
            title: "Apply",
            icon: "glyp-checkmark",
            click: { key: this.submitKey }
        })

        this.onClick(this.submitKey, _ => {
            this.state.onSorted(this.orderBys)
            this.pop()
        })

        this.addAction({
            title: "New Clause",
            icon: "glyp-plus",
            click: { key: this.newClauseKey }
        }, 'secondary')

        this.onClick(this.newClauseKey, _ => {
            this.addClause()
        })

        this.onClick(this.removeClauseKey, m => {
            this.removeClause(m.data.index)
        })

        // collect the column options
        const query = this.state.query
        const existingColumns = new Set<string>()
        Queries.eachColumn(query, (table, col) => {
            const name = Columns.computeSelectName(table, col)
            existingColumns.add(name)
            this.columnOptions.push({title: name, value: name})
        })

        // initialize the order-bys from the query, if present
        if (query.order_by?.length) {
            // filter out columns that are no longer present in the query
            this.orderBys = query.order_by.filter(ob => existingColumns.has(ob.column))
        }
        if (!query.order_by?.length) { // this isn't an else because the previous clause might've resulted in no columns
            // start with something by default
            this.addClause()
        }

        // serialize on input change
        this.onChange(this.changedKey, _ => {
            this.serialize()
        })

        // make the list sortable
        this.makePlugin(SortablePlugin, {
            zoneClass: 'dive-row-sort-zone',
            targetClass: 'order-by',
            onSorted: (_plugin, _evt) => {
                this.serialize()
            }
        })
    }

    addClause() {
        this.orderBys.push({ column: this.columnOptions[0]?.value || '', dir: 'asc' })
        log.info(`Added a line, orderBys is now ${this.orderBys.length} long`, this.orderBys)
        this.dirty()
    }

    removeClause(index: number) {
        log.info(`Removing clause ${index}`)
        this.orderBys.splice(index, 1)
        log.info(`Removed line ${index}, orderBys is now ${this.orderBys.length} long`, this.orderBys)
        this.dirty()
    }

    serialize() {
        log.info("Serializing...")
        if (this.element) {
            this.orderBys = []
            this.element.querySelectorAll<HTMLElement>(".order-by").forEach(line => {
                const column = line.querySelector<HTMLSelectElement>("select.column")?.value!!
                const dir = Forms.getRadioValue(line, "input.dir") || "asc"
                this.orderBys.push({ column, dir })
            })
            log.info("Serialized", this.orderBys)
        }
    }

    renderContent(parent: PartTag): void {
        parent.div('.tt-flex.column.padded.gap.tt-form', container => {
            container.p().text("Drag and drop the clauses to change their order:")
            container.div(".dive-row-sort-zone", zone => {
                let index = 0 // for making unique radio names
                for (const orderBy of this.orderBys) {
                    zone.div(".order-by", { data: { index: index.toString() } }, line => {
                        line.a(".drag.glyp-navicon")
                            .data({ tooltip: "Re-order this clause" })
                        line.select('.column', colSelect => {
                            optionsForSelect(colSelect, this.columnOptions, orderBy.column)
                        }).emitChange(this.changedKey)
                        line.label('.caption-size', label => {
                            label.input('.dir.dir-asc', {
                                type: "radio",
                                name: `sort-dir-${index}`,
                                value: "asc",
                                checked: orderBy.dir == 'asc'
                            }).emitChange(this.changedKey)
                            label.span().text("ascending")
                        })
                        line.label('.caption-size', label => {
                            label.input('.dir.dir-desc', {
                                type: "radio",
                                name: `sort-dir-${index}`,
                                value: "desc",
                                checked: orderBy.dir == 'desc'
                            }).emitChange(this.changedKey)
                            label.span().text("descending")
                        })
                        line.a(".remove.glyp-close")
                            .data({ tooltip: "Remove this clause" })
                            .emitClick(this.removeClauseKey, { index })
                    })
                    index += 1
                }
            })
        })
    }

}