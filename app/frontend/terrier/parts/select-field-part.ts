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
        this.onClick(this._toggleDropdownKey, m => {
            const target = m.event.currentTarget as HTMLElement
            if (target.classList.contains('disabled')) return
            this.toggleDropdown(SelectOptionsDropdown, {
                options: this.state.options,
                selected_option: this.state.selected_option,
                select_key: this.selectedOptionKey
            }, this.element)
        })
        this.listenMessage(this.selectedOptionKey, m => {
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
        if (option.title === undefined) {
            // consider option groups and flatten the options
            const options = this.state.options.flatMap((option) => {
                if ('group' in option) {
                    return option.options
                } else return option
            })

            // find the option where title is empty and use that as the blank option value
            return options.find((opt) => {
                if ('value' in opt) {
                    return opt.value == ''
                } else return false
            }) || option
        } else {
            return option
        }
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
    _clearDropdownKey = Messages.untypedKey()

    async init() {
        await super.init()
        this.onClick(this._clickedOptionKey, m => {
            this.emitMessage(this.state.select_key, {selected_option: m.data.selected_option})
            this.clear()
        })

        this.onClick(this._clearDropdownKey, _ => {
            this.clear()
        })
    }

    get autoClose(): boolean {
        return true
    }

    get parentClasses(): Array<string> {
        return ['tt-select-options-dropdown-container', ...super.parentClasses]
    }

    renderContent(parent: PartTag) {
        parent.div('.tt-select-options-dropdown', dropdown => {
            for (const opt of this.state.options) {
                if ('group' in opt) {
                    dropdown.div('.tt-select-options-group-header', {text: opt.group})
                    for (const groupOpt of opt.options) {
                        this.renderOption(dropdown, groupOpt)
                    }
                } else {
                    this.renderOption(dropdown, opt)
                }
            }
        })
        parent.emitClick(this._clearDropdownKey)
    }

    renderOption(parent: PartTag, opt: SelectOption) {
        parent.div({text: opt.title}, option => {
            if (this.state.selected_option.value == opt.value) option.class('selected')
        }).emitClick(this._clickedOptionKey, {selected_option: opt})
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
    anchorSelectDropdown(dropdownContainer: HTMLElement, selectField: HTMLElement, selectedElement: HTMLElement) {
        const dropdown = dropdownContainer.querySelector('.tt-select-options-dropdown') as HTMLElement
        const dropdownContainerSize = Overlays.getElementSize(dropdownContainer)
        const selectOptionSize = Overlays.getElementSize(selectedElement)

        const selectedOptionIndex = Array.prototype.indexOf.call(dropdown.childNodes, selectedElement)

        const anchorRect = selectField.getBoundingClientRect()
        const win = Overlays.getWindowSize()

        const result: AnchorResult = {
            top: 0,
            left: anchorRect.x,
            valid: true
        }

        Overlays.clampAnchorResult(result, dropdownContainerSize, win)

        if (dropdownContainerSize.width < anchorRect.width) {
            result.width = anchorRect.width
        }

        let scrollAmount = selectedElement.offsetTop - anchorRect.top
        let scrollTop = anchorRect.y + (anchorRect.height / 2) - (selectOptionSize.height / 2)

        if (dropdown.offsetHeight > win.height - anchorRect.top || anchorRect.top - dropdown.offsetHeight < 0) { // attempting to fill the whole window height with the dropdownContainer, so we need to adjust scroll of dropdownContainer
            if (scrollAmount < 0) { // space above the dropdown
                dropdown.style.marginTop = `${-scrollAmount}px`
                scrollTop = 0
            } else if (dropdown.offsetHeight - scrollAmount < win.height) { // space below the dropdown
                dropdown.style.marginBottom = `${win.height - (dropdown.offsetHeight - scrollAmount) - 8}px`
                scrollTop = scrollAmount
            } else { // fills the whole screen
                scrollTop = scrollAmount
            }
        } else { // dropdown is less tall than the window
            result.top = anchorRect.y - (selectOptionSize.height * selectedOptionIndex) - 4
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

        dropdownContainer.setAttribute('style', styleString)
        dropdownContainer.scrollTo({top: scrollTop})

        dropdownContainer.classList.add('show')
        selectedElement.classList.add('hover')
        selectedElement.addEventListener('mouseleave', () => selectedElement.classList.remove('hover'))
    }
}
