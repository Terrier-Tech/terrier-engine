import {Action, IconName} from "./theme"
import TerrierPart from "./parts/terrier-part"
import {PartTag} from "tuff-core/parts"
import Fragments from "./fragments"
import {messages} from "tuff-core"
import {Logger} from "tuff-core/logging"

const log = new Logger('Sheets')


////////////////////////////////////////////////////////////////////////////////
// Parts
////////////////////////////////////////////////////////////////////////////////

export type SheetState = {
    title: string
    icon: IconName
    body: string
    primaryActions?: Action[]
    secondaryActions?: Action[]
}

const clearKey = messages.untypedKey()

export class Sheet<TState extends SheetState> extends TerrierPart<TState> {

    /**
     * Removes itself from the DOM.
     */
    clear() {
        log.info("Clearing sheet")
        this.app.removeOverlay(this.state)
    }

    async init() {
        this.onClick(clearKey, _ => {
            this.clear()
        })
    }

    get parentClasses(): Array<string> {
        return ['tt-sheet']
    }

    render(parent: PartTag): any {
        parent.div('.tt-sheet-backdrop')
        const panel = Fragments.panel(this.theme)
            .title(this.state.title)
            .icon(this.state.icon)
            .content(panel => {
                panel.class('padded')
                panel.div('.body').text(this.state.body)
            })
        for (const action of this.state.primaryActions || []) {
            // if it doesn't have a click key, it must be a close button
            action.click ||= {key: clearKey}
            panel.addAction(action, 'primary')
        }
        for (const action of this.state.secondaryActions || []) {
            // if it doesn't have a click key, it must be a close button
            action.click ||= {key: clearKey}
            panel.addAction(action, 'secondary')
        }
        panel.render(parent)
    }

    update(_elem: HTMLElement) {
        setTimeout(
            () => _elem.classList.add('show'),
            10
        )

    }
}


////////////////////////////////////////////////////////////////////////////////
// Types
////////////////////////////////////////////////////////////////////////////////

/**
 * State type for a sheet that asks the user to confirm a choice.
 */
export type ConfirmSheetState = Pick<SheetState, 'title' | 'body' | 'icon'>

/**
 * State type for a sheet that tells the user something with no options.
 */
export type AlertSheetState = Pick<SheetState, 'title' | 'body' | 'icon'>


////////////////////////////////////////////////////////////////////////////////
// Export
////////////////////////////////////////////////////////////////////////////////

const Sheets = {
    clearKey
}

export default Sheets