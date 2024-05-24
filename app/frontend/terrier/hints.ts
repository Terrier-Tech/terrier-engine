import Html, {DivTag, HtmlParentTag} from "tuff-core/html"
import Messages from "tuff-core/messages"
import {PartPlugin} from "tuff-core/plugins"
import Theme, {IconName} from "./theme"
import PagePart from "./parts/page-part"
import TerrierPart from "./parts/terrier-part"

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

/**
 * Render a hint into the given tag
 * @param theme the theme to render the hint icon with
 * @param parent the parent tag to render the hint into
 * @param hint the hint to render
 * @param options options to modify how the hint is rendered
 */
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

/**
 * Add a hint element to the given parent element
 * @param theme the theme to render the hint icon with
 * @param parentElement the element to add the hint element to
 * @param hint the hint to add
 * @param options options to modify how the hint is rendered
 * @param insertPosition specify where to insert the hint relative to the parent element
 */
function injectHint(theme: Theme, parentElement: Element, hint: Hint, options?: HintRenderOptions, insertPosition: InsertPosition = 'beforeend'): HTMLDivElement {
    const elem = Html.createElement('div', div => renderHint(theme, div, hint, options)).firstElementChild as HTMLDivElement
    parentElement.insertAdjacentElement(insertPosition, elem)
    return elem
}

export type DynamicHint = {
    selector: string
    hint: Hint
    options?: HintRenderOptions
    insertPosition?: InsertPosition
    onlyFirstMatch?: boolean // only add a hint to the first element that matches the selector
}

/**
 * Adds dynamic hints to a given part. Dynamic hints will detect changes to the DOM to update where they are rendered
 * @param part the part to add dynamic hints to. Dynamic hints will only be added to matching elements under the part's root element
 * @param hints the hints to add.
 */
function addDynamicHints(part: TerrierPart<any>, hints: DynamicHint[]) {
    part.makePlugin(DynamicHintsPlugin, hints)
}

class DynamicHintsPlugin extends PartPlugin<DynamicHint[]> {
    observer: MutationObserver = new MutationObserver(this.handleMutations.bind(this))

    async init() {
        if (!('theme' in this.part)) throw new Error("DynamicHintsPlugin requires a TerrierPart")
    }

    update(elem: HTMLElement) {
        super.update(elem)

        this.addDynamicHints(elem)
        this.observer.disconnect()
        this.observer.observe(elem, { childList: true, subtree: true })
    }

    private handleMutations(mutations: MutationRecord[], _observer: MutationObserver): void {
        // Ignore mutations that added hint elements (prevents infinite recursion)
        const addedHints = mutations.some(m =>
            Array.from(m.addedNodes).some(n => n instanceof HTMLElement && n.dataset.hintSource === 'DynamicHintsPlugin')
        )
        if (addedHints) return
        if (!this.part.element) return
        this.addDynamicHints(this.part.element)
    }

    private addDynamicHints(elem: HTMLElement) {
        const theme = (this.part as TerrierPart<any>).theme

        elem.querySelectorAll('.tt-hint[data-hint-source=DynamicHintsPlugin]').forEach(e => e.remove())

        for (const dynamicHint of this.state) {
            const matches = elem.querySelectorAll(dynamicHint.selector)
            if (!matches.length) continue
            if (dynamicHint.onlyFirstMatch) {
                this.addDynamicHint(theme, matches[0], dynamicHint)
            } else {
                matches.forEach(match => this.addDynamicHint(theme, match, dynamicHint))
            }
        }
    }

    private addDynamicHint(theme: Theme, elem: Element, hint: DynamicHint) {
        const hintElement = injectHint(theme, elem, hint.hint, hint.options, hint.insertPosition ?? 'beforeend')
        hintElement.dataset.hintSource = 'DynamicHintsPlugin'
    }
}

/**
 * Adds a hints toggle checkbox to a page's toolbar and handles persisting the state of the checkbox between visits.
 * @param part the page to add a checkbox to
 * @param hintKey a key for this page so that the checkbox state can be persisted
 */
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
    injectHint,
    addDynamicHints,
    addHintToggle,
}

export default Hints