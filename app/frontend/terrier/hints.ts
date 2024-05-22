import {DivTag, HtmlParentTag} from "tuff-core/html"
import Messages from "tuff-core/messages"
import {PartPlugin} from "tuff-core/plugins"
import Theme, {IconName} from "./theme"
import PagePart from "./parts/page-part"

export type Hint = {
    title?: string
    icon?: IconName
    tooltip?: string
}

export type HintRenderOptions = {
    classes?: string[]
    side?: 'inline' | 'top' | 'right' | 'bottom' | 'left' | 'inline-top' | 'inline-right' | 'inline-bottom' | 'inline-left'
    hideIcon?: boolean
}

function renderHint(theme: Theme, parent: HtmlParentTag, hint: Hint, options?: HintRenderOptions): DivTag {
    const hintTag = parent.div('.tt-hint')

    if (hint.tooltip) hintTag.dataAttr('tooltip', hint.tooltip)
    if (options?.classes) hintTag.class(...options.classes)
    if (options?.side && options.side != 'inline') hintTag.dataAttr('tt-hint-side', options.side)

    const hideIcon = options?.hideIcon ?? false
    if (!hideIcon) {
        const icon = hint.icon ?? 'glyp-hint'
        theme.renderIcon(hintTag, icon)
    }

    if (hint.title) hintTag.span('.tt-hint-title').text(hint.title)

    return hintTag
}

function addHintToggle(part: PagePart<any>, hintKey: string) {
    part.makePlugin(HintTogglePlugin, { hintKey })
}

class HintTogglePlugin extends PartPlugin<{ hintKey: string }> {

    checkboxChangedKey = Messages.untypedKey()
    storageKey = `show-hints-${this.state.hintKey}`

    get storedValue() {
        const stored = localStorage.getItem(this.storageKey)
        return stored == null ? true : stored == 'true'
    }

    set storedValue(value: boolean) {
        localStorage.setItem(this.storageKey, value.toString())
    }

    async init() {
        document.body.classList.toggle('tt-hints-hidden', !this.storedValue)

        const part = this.part as PagePart<any>
        part.addToolbarInput('show-hints', 'checkbox', {
            title: "Hints",
            icon: 'glyp-hint',
            onChangeKey: this.checkboxChangedKey,
            onInputKey: this.checkboxChangedKey,
        })

        part.onInput(this.checkboxChangedKey, m => {
            const checked = (m.event.target as HTMLInputElement).checked
            this.storedValue = checked
            document.body.classList.toggle('tt-hints-hidden', !checked)
        })
    }

    update(elem: HTMLElement) {
        super.update(elem)

        const checkbox = elem.querySelector(`[data-toolbar-field-name=show-hints]`)

        if (checkbox instanceof HTMLInputElement) {
            checkbox.checked = this.storedValue
        }
    }
}

const Hints = {
    renderHint,
    addHintToggle,
}

export default Hints