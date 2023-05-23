import {PartTag} from "tuff-core/parts"
import {AnchorTagAttrs, HtmlParentTag} from "tuff-core/html"
import Theme, {Action, Packet, ThemeType} from "./theme"
import {ActionLevel, PanelActions} from "./parts/content-part"

/**
 * Base class for Panel and Card fragment builders.
 */
abstract class ContentFragment<TT extends ThemeType> {
    protected constructor(readonly prefix: string, readonly theme: Theme<TT>) {

    }

    protected _title?: string

    /**
     * @param t the title
     * @param icon the optional icon
     */
    title(t: string, icon?: TT['icons']) {
        this._title = t
        this._icon = icon
        return this
    }

    protected _icon?: TT['icons']

    /**
     * @param i the panel icon
     */
    icon(i: TT['icons']) {
        this._icon = i
        return this
    }

    protected _content?: (parent: HtmlParentTag) => void

    /**
     * @param fun a function that renders the panel content
     */
    content(fun: (parent: HtmlParentTag) => void) {
        this._content = fun
        return this
    }

}


export class PanelFragment<TT extends ThemeType> extends ContentFragment<TT> {
    constructor(theme: Theme<TT>) {
        super('tt-panel', theme)
    }

    /// Actions

    actions = {
        primary: Array<Action<TT>>(),
        secondary: Array<Action<TT>>(),
        tertiary: Array<Action<TT>>()
    }

    /**
     * Add an action to the panel.
     * @param action the action to add
     * @param level whether it's a primary, secondary, or tertiary action
     */
    addAction(action: Action<TT>, level: ActionLevel = 'primary') {
        this.actions[level].push(action)
        return this
    }

    /**
     * Renders the panel into the given parent tag
     * @param parent
     */
    render(parent: PartTag) {
        const noTtPrefix = this.prefix.replace('tt-', '')
        return parent.div(this.prefix, panel => {
            if (this._title?.length) {
                panel.div(`.${noTtPrefix}-header`, header => {
                    header.h2(h2 => {
                        if (this._icon) {
                            this.theme.renderIcon(h2, this._icon, 'link')
                        }
                        h2.div('.title', {text: this._title})
                    })
                    this.theme.renderActions(header, this.actions.tertiary)
                })
            }
            panel.div(`.${noTtPrefix}-content`, content => {
                if (this._content) {
                    this._content(content)
                }
            })
            panelActions(panel, this.actions, this.theme)
        })
    }

}

/**
 * Render the primary and secondary actions to the bottom of a panel
 * @param panel the .panel container
 * @param actions the actions
 */
function panelActions<TT extends ThemeType>(panel: PartTag, actions: PanelActions<TT>, theme: Theme<TT>) {
    if (actions.primary.length || actions.secondary.length) {
        panel.div('.panel-actions', actionsContainer => {
            actionsContainer.div('.secondary-actions', secondaryContainer => {
                theme.renderActions(secondaryContainer, actions.secondary, {iconColor: 'white', defaultClass: 'link'})
            })
            actionsContainer.div('.primary-actions', primaryContainer => {
                theme.renderActions(primaryContainer, actions.primary, {iconColor: 'white'})
            })
        })
    }
}


/**
 * Cards are like panels except they don't have any actions and are themselves an anchor.
 */
class CardFragment<TT extends ThemeType> extends ContentFragment<TT> {
    constructor(theme: Theme<TT>) {
        super('tt-card', theme)
    }

    private _href?: string

    /**
     * Sets the href of the anchor tag
     * @param h
     */
    href(h: string) {
        this._href = h
        return this
    }

    /**
     * Renders the card into the given parent tag
     * @param parent
     */
    render(parent: PartTag) {
        const noTtPrefix = this.prefix.replace('tt-', '')
        return parent.a({href: this._href}, this.prefix, panel => {
            if (this._title?.length) {
                panel.div(`.${noTtPrefix}-header`, header => {
                    if (this._icon) {
                        this.theme.renderIcon(header, this._icon, 'link')
                    }
                    header.h3({text: this._title})
                })
            }
            panel.div(`.${noTtPrefix}-content`, content => {
                if (this._content) {
                    this._content(content)
                }
            })
        })
    }

}


class LabeledValueFragment<TT extends ThemeType> extends ContentFragment<TT> {

    constructor(theme: Theme<TT>) {
        super('tt-labeled-value', theme)
    }

    private _value?: string
    private _valueIcon?: TT['icons']
    private _valueIconColor?: TT['colors'] | null
    private _valueClass?: string[]

    private _href?: string
    private _hrefTarget?: string

    private _click?: Packet

    private _tooltip?: string

    value(value: string, icon?: TT['icons'], iconColor?: TT['colors'] | null) {
        this._value = value
        this._valueIcon = icon
        this._valueIconColor = iconColor
        return this
    }

    valueClass(...classes: string[]) {
        this._valueClass = classes
        return this
    }

    href(value: string, target?: string) {
        this._href = value
        if (target) this._hrefTarget = target
        return this
    }

    emitClick(packet?: Packet) {
        this._click = packet
        return this
    }

    /**
     * Set the tooltip that will show for the value
     * @param tooltip
     */
    tooltip(tooltip: string) {
        this._tooltip = tooltip
        return this
    }

    render(parent: PartTag) {
        parent.div('.tt-labeled-value', container => {
            if (this._title) {
                container.div('.title', title => {
                    if (this._icon) {
                        this.theme.renderIcon(title, this._icon, 'link')
                    }
                    title.div({text: this._title})
                })
            }

            container.div('.value', div => {
                let valueBox: HtmlParentTag = div
                if (this._href?.length) {
                    valueBox = div.a({ href: this._href, target: this._hrefTarget })
                } else if (this._click) {
                    valueBox = div.a()
                    valueBox.emitClick(this._click.key, this._click.data ?? {})
                }

                if (this._valueClass?.length) div.class(...this._valueClass)
                if (this._tooltip) valueBox.dataAttr("tooltip", this._tooltip)
                if (this._value) {
                    if (this._valueIcon) {
                        const color = (this._valueIconColor === undefined) ? 'link' : this._valueIconColor
                        this.theme.renderIcon(valueBox, this._valueIcon, color)
                    }
                    valueBox.div('.value-text', {text: this._value})
                }
                else if (this._content) {
                    this._content(valueBox)
                }
            })
        })
    }
}

type ListValueDefinition = {
    value: string
    href?: string
    hrefTarget?: string
    tooltip?: string
}

class LabeledListFragment<TT extends ThemeType> extends ContentFragment<TT> {
    private _values?: ListValueDefinition[]

    constructor(theme: Theme<TT>) {
        super('tt-labeled-list', theme)
    }

    render(parent: PartTag) {
        parent.div('.tt-labeled-list', container => {
            if (this._title) {
                container.div('.title', title => {
                    if (this._icon) {
                        this.theme.renderIcon(title, this._icon, 'link')
                    }
                    title.div({ text: this._title })
                })
            }
            container.div('.value.tt-flex.wrap', valueBox => {
                for (const listItem of this._values ?? []) {
                    valueBox.div('.tt-flex.shrink.align-center.secondary', badge => {
                        if (listItem.tooltip) badge.dataAttr("tooltip", listItem.tooltip)

                        const anchorAttrs: AnchorTagAttrs = { classes: ['tt-button'], text: listItem.value }
                        if (listItem.href?.length) {
                            anchorAttrs.classes?.push('secondary')
                            anchorAttrs.href = listItem.href
                            anchorAttrs.target = listItem.hrefTarget ?? '_blank'
                        } else {
                            anchorAttrs.classes?.push('readonly disabled')
                        }

                        badge.a(anchorAttrs)
                    })
                }
            })
        })
    }

    values(values: ListValueDefinition[]) {
        this._values = values
        return this
    }
}


/**
 * Creates a new card fragment builder.
 * Make sure to call `render()` in order to render it to a parent tag.
 */
function card<TT extends ThemeType>(theme: Theme<TT>) {
    return new CardFragment(theme)
}


/**
 * Creates a new panel fragment builder.
 * Make sure to call `render()` in order to render it to a parent tag.
 */
function panel<TT extends ThemeType>(theme: Theme<TT>) {
    return new PanelFragment(theme)
}

/**
 * Creates a new labeled value fragment builder.
 * Make sure to call `render()` in order to render it to a parent tag.
 */
function labeledValue<TT extends ThemeType>(theme: Theme<TT>) {
    return new LabeledValueFragment(theme)
}

function labeledList<TT extends ThemeType>(theme: Theme<TT>) {
    return new LabeledListFragment(theme)
}

/**
 * Create a new button in the parent.
 */
function button<TT extends ThemeType>(parent: PartTag, theme: Theme<TT>, title?: string, icon?: TT['icons'], iconColor: TT['colors'] | null = null) {
    return parent.a('.tt-button', button => {
        if (icon) theme.renderIcon(button, icon, iconColor)
        if (title?.length) button.div('.title', {text: title})
    })
}

/**
 * Create a new simple value display in the parent.
 * This is just some text with an optional icon that doesn't have a separate label.
 */
function simpleValue<TT extends ThemeType>(parent: PartTag, theme: Theme<TT>, title: string, icon?: TT['icons'], iconColor: TT['colors'] | null = 'link') {
    return parent.div('.tt-simple-value.shrink', button => {
        if (icon) theme.renderIcon(button, icon, iconColor)
        button.div('.title', {text: title})
    })
}

/**
 * Helper to create a heading with an optional icon.
 */
function simpleHeading<TT extends ThemeType>(parent: PartTag, theme: Theme<TT>, title: string, icon?: TT['icons']) {
    return parent.h3('.shrink', heading => {
        if (icon) {
            theme.renderIcon(heading, icon, 'link')
        }
        heading.div('.title', {text: title})
    })
}




const Fragments = {
    ContentFragment,
    panel,
    PanelFragment,
    card,
    CardFragment,
    labeledValue,
    LabeledValueFragment,
    labeledList,
    LabeledListFragment,
    button,
    simpleValue,
    simpleHeading,
    panelActions
}

export default Fragments