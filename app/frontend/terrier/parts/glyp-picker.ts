import {ModalPart} from "../modals"
import {Part, PartTag} from "tuff-core/parts"
import Glyps from "../glyps"
import {Logger} from "tuff-core/logging"
import Messages from "tuff-core/messages"

const log = new Logger("GlypPicker")


const pickKey = Messages.typedKey<{ icon: string }>()

export type GlypPickerState = {
    icon?: string
    onPicked: (icon?: string) => any
}

/**
 * A modal that allows the user to pick a glyp.
 */
class GlypPickerModal extends ModalPart<GlypPickerState> {

    grid!: GlypGrid

    filterKey = Messages.untypedKey()

    async init() {
        await super.init()

        this.setIcon('glyp-cursor')
        this.setTitle("Choose an Icon")

        this.grid = this.makePart(GlypGrid, {})

        this.onKeyUp(this.filterKey, m => {
            log.info(`Filter key up`, m)
            const filter = (m.event.target as HTMLInputElement).value
            this.grid.setFilter(filter)
        })

        this.onClick(pickKey, m => {
            log.info(`Picked ${m.data.icon}`)
            this.state.onPicked(m.data.icon)
            this.pop()
        })
    }

    renderContent(parent: PartTag) {
        parent.div('.glyp-picker-part.tt-flex.column.gap.padded.tt-form', picker => {
            picker.input({type: 'search', placeholder: 'Filter'})
                .emitKeyUp(this.filterKey)
                .emitChange(this.filterKey)
            picker.div('.grid-container', container => {
                container.part(this.grid)
            })
        })
    }


}

/**
 * A grid of labeled glyps with an optional filter.
 */
class GlypGrid extends Part<{ filter?: string }> {

    setFilter(filter: string) {
        this.state.filter = filter
        this.dirty()
    }

    clearFilter() {
        this.state.filter = undefined
        this.dirty()
    }

    get parentClasses(): Array<string> {
        return ['glyp-picker-grid']
    }

    render(parent: PartTag) {
        const filter = this.state.filter ? this.state.filter.trim().toLowerCase() : null
        for (const glyp of Glyps.names) {
            if (!filter || glyp.includes(filter)) {
                parent.a(a => {
                    a.i(glyp)
                    a.div('.title').text(Glyps.displayName(glyp))
                }).emitClick(pickKey, {icon: glyp})
            }
        }
    }

}


const GlypPicker = {
    Modal: GlypPickerModal
}

export default GlypPicker