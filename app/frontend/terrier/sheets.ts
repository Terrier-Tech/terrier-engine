import { GlypName } from "./glyps"
import {Action, IconName} from "./theme"
import TerrierPart from "./parts/terrier-part"
import {PartTag} from "tuff-core/parts"
import Fragments from "./fragments"
import {Logger} from "tuff-core/logging"
import Messages from "tuff-core/messages"

const log = new Logger('Sheets')


////////////////////////////////////////////////////////////////////////////////
// Inputs
////////////////////////////////////////////////////////////////////////////////

export type SheetInput = {
    type: 'text'
    key: string
    value: string
    label?: string
    icon?: GlypName
}


////////////////////////////////////////////////////////////////////////////////
// Parts
////////////////////////////////////////////////////////////////////////////////

export type SheetState = {
    title: string
    icon: IconName
    body: string
    primaryActions?: Action[]
    secondaryActions?: Action[]
    inputs?: SheetInput[]
}

const clearKey = Messages.untypedKey()

/**
 * Show a little popup sheet at the bottom of the screen that's much nicer than a native alert() or confirm().
 */
export class Sheet<TState extends SheetState> extends TerrierPart<TState> {

    inputChangedKey = Messages.typedKey<{key: string}>()

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

        this.onChange(this.inputChangedKey, m => {
            const key = m.data.key
            const value = m.value
            log.info(`Input ${key} changed to ${value}`)
            this.state.inputs?.forEach(input => {
                if (input.key === key) {
                    input.value = value
                }
            })
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
                panel.class('padded', 'tt-form')
                panel.div('.body').text(this.state.body)
                for (const input of this.state.inputs || []) {
                    this.renderInput(panel, input)
                }
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

    renderInput(parent: PartTag, input: SheetInput) {
        parent.div('.tt-sheet-input', container => {
            if (input.label?.length) {
                container.label().text(input.label)
            }
            container.input({type: 'text', value: input.value})
                .data({key: input.key})
                .emitChange(this.inputChangedKey, {key: input.key})
        })
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
export type ConfirmSheetState = Pick<SheetState, 'title' | 'body' | 'icon' | 'inputs'>

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