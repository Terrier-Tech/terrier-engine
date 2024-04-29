import {SelectOption, SelectOptions} from "tuff-core/forms"
import Messages, { TypedKey } from "tuff-core/messages"
import {PartTag} from "tuff-core/parts"
import {Dropdown} from "../dropdowns"
import Overlays, {AnchorResult} from "../overlays"
import TerrierPart from "./terrier-part";

/**
 * Replacement part for a 'select' field that retrieves its options from a centralized data source
 * rather than appending them to the DOM. When there are multiple select fields on the same page
 * with the same set of options, this is more efficient than the standard 'select' field.
 */

export type SelectFieldState = {
    /** the options to add */
    options: SelectOptions
    /** the currently selected option value */
    selected_option: SelectOption
}

export class SelectFieldPart<T extends SelectFieldState> extends TerrierPart<T> {
    _toggleDropdownKey = Messages.untypedKey()

    selectedOptionKey = Messages.typedKey<{ selected_option: SelectOption }>()

    async init() {
        await super.init()
        this.state.selected_option = this.populateOptionIfBlank(this.state.selected_option)
        this.onClick(this._toggleDropdownKey, () => {
            this.toggleDropdown(SelectOptionsDropdown, {
                options: this.state.options,
                selected_option: this.state.selected_option,
                select_key: this.selectedOptionKey
            }, this.element)
        })
        this.listenMessage(this.selectedOptionKey, m => {
            console.log('heard option selected')
            this.onOptionSelected(m.data.selected_option)
        }, { attach: "passive" })
    }

    get parentClasses(): Array<string> {
        return ['tt-select-field', ...super.parentClasses]
    }

    onOptionSelected(selectedOption: SelectOption) {
        this.assignState({ ...this.state, selected_option: selectedOption })
    }

    assignState(state: T) {
        if (state == this.state) {
            return false
        }
        this.state = state
        this.state.selected_option = this.populateOptionIfBlank(this.state.selected_option)
        this.dirty()
        return true
    }

    populateOptionIfBlank(option: SelectOption) {
        let newValue = option.value
        let newTitle = option.title

        if (option.value == '' && option.title === undefined) {
            newValue = null
            newTitle = ''
        } else if (option.value == null && option.title === undefined) {
            newValue = ''
            newTitle = ''
        }
        return { title: newTitle, value: newValue }
    }

    render(parent: PartTag) {
        parent.div({ text: this.state.selected_option.title })
        parent.emitClick(this._toggleDropdownKey)
    }
}

/**
 * Dropdown part to accompany the centralized data select field
 */

export type SelectFieldDropdownState = SelectFieldState & {
    select_key: TypedKey<{ selected_option: SelectOption }>
}
export class SelectOptionsDropdown extends Dropdown<SelectFieldDropdownState> {
    _clickedOptionKey = Messages.typedKey<{ selected_option: SelectOption }>()

    async init() {
        await super.init()
        this.onClick(this._clickedOptionKey, m => {
            this.emitMessage(this.state.select_key, { selected_option: m.data.selected_option })
            this.clear()
        })
    }
    get autoClose(): boolean {
        return true
    }

    get parentClasses(): Array<string> {
        return ['tt-select-options-dropdown', ...super.parentClasses]
    }

    renderContent(parent: PartTag) {
        for (const opt of this.state.options) {
            if ('group' in opt) {
                parent.div('.tt-select-options-group-header', { text: opt.group } )
                for (const groupOpt of opt.options) {
                    this.renderOption(parent, groupOpt)
                }
            } else {
                this.renderOption(parent, opt)
            }
        }
    }

    renderOption(parent: PartTag, opt: SelectOption) {
        parent.div({ text: opt.title }, option => {
            if (this.state.selected_option.value == opt.value) option.class('selected')
        }).emitClick(this._clickedOptionKey, { selected_option: opt })
    }

    update(elem: HTMLElement) {
        const dropdown = elem.querySelector('.tt-dropdown-content') as HTMLElement
        if (dropdown) {
            const selectedElement = dropdown.querySelector('.selected') as HTMLElement
            if (this.anchorTarget && selectedElement) {
                this.anchorSelectDropdown(dropdown, this.anchorTarget, selectedElement)
            }
        }
    }

    /**
     * Anchors a select dropdown on top of a select field. Uses the currently selected child option to determine positioning.
     * Assumes that all child elements have the same height.
     * @param dropdown the element to reposition
     * @param selectField the anchor select field
     * @param selectedElement the selected option that will be positioned directly above the select field
     */
    anchorSelectDropdown(dropdown: HTMLElement, selectField: HTMLElement, selectedElement: HTMLElement) {
        const dropdownSize = Overlays.getElementSize(dropdown)
        const selectOptionSize = Overlays.getElementSize(selectedElement)

        const selectedOptionIndex = Array.prototype.indexOf.call(dropdown.childNodes, selectedElement)

        const anchorRect = selectField.getBoundingClientRect()
        const win = Overlays.getWindowSize()

        const result: AnchorResult = {
            top: anchorRect.y - (selectOptionSize.height * selectedOptionIndex),
            left: anchorRect.x,
            valid: true
        }

        Overlays.clampAnchorResult(result, dropdownSize, win)

        if (dropdownSize.width < anchorRect.width) {
            result.width = anchorRect.width
        }

        // how far down the select options list we need to scroll
        let scrollAmount = selectedElement.offsetTop

        let scrollTop = scrollAmount - anchorRect.top
        let dropdownIsShrunk = false

        if (dropdownSize.height > win.height - anchorRect.top) { // attempting to fill the whole window height with the dropdown, so we may need to adjust placement of dropdown
            if (scrollAmount < anchorRect.top) { // need space above the dropdown
                result.top = anchorRect.top - scrollAmount
                result.height = win.height - result.top
                scrollTop = 0
                dropdownIsShrunk = true
            } else if (dropdownSize.height - scrollAmount < win.height) { // need space below the dropdown
                result.height = dropdownSize.height - scrollAmount + anchorRect.top
                scrollTop = scrollAmount
                dropdownIsShrunk = true
            }
        } else {
            if (this.state.options.find((o) => 'group' in o)) {
                result.top += selectOptionSize.height
            }
        }

        let styleString = ""
        for (const key of ['top', 'left', 'width', 'height'] as const) {
            if (result[key] != null) {
                styleString += `${key}: ${result[key]}px;`
            }
        }

        dropdown.setAttribute('style', styleString)
        dropdown.scrollTo({ top: scrollTop })

        dropdown.classList.add('show')
        selectedElement.classList.add('hover')
        selectedElement.addEventListener('mouseleave', () => selectedElement.classList.remove('hover'))

        // if the dropdown has been temporarily shrunk, increase the size as we scroll
        if (dropdownIsShrunk) {
            let currentHeight = dropdown.clientHeight
            let currentScrollTop = dropdown.scrollTop
            dropdown.addEventListener('scroll', _ => {
                const newScrollTop = dropdown.scrollTop; // Get scroll position
                const scrollDiff = currentScrollTop - newScrollTop

                if (scrollDiff > 0) { // scrolling up
                    // Calculate new height based on scroll amount
                    const newHeight = Math.min(currentHeight + scrollDiff, window.innerHeight) // Don't exceed window height

                    // Update the element's height
                    dropdown.style.height = `${newHeight}px`

                    currentHeight = newHeight
                    currentScrollTop = newScrollTop
                } else if (scrollDiff < 0) { // scrolling down
                    // if there is space above the dropdown, also adjust the top
                    const newHeight = Math.min(currentHeight - scrollDiff, window.innerHeight)
                    dropdown.style.height = `${newHeight}px`

                    const newTop = window.innerHeight - newHeight
                    dropdown.style.top = `${newTop}px`

                    if (newTop > 0) {
                        dropdown.scrollTo({ top: currentScrollTop })
                    }

                    currentHeight = newHeight
                }
            })
        }
    }
}
