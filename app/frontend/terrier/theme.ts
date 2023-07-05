import {PartTag} from "tuff-core/parts"
import {messages} from "tuff-core"
import {GlypName} from "./glyps"
import HubIcons, {HubIconName} from "./gen/hub-icons"

export interface ThemeType {
    readonly icons: string
    readonly colors: string
}


export type IconName = GlypName | HubIconName

export const ColorNames = [
    'link', 'primary', 'secondary', 'active', 'pending', 'success', 'warn', 'alert', 'white', 'inactive', 'super', 'billing', 'docs'
] as const

export type ColorName = typeof ColorNames[number]


/**
 * A combination of a message key and its associated data.
 */
export type Packet = {
    key: messages.Key
    data?: Record<string, unknown>
}

/**
 * An action that generates a button or link.
 */
export type Action = {
    title?: string
    tooltip?: string
    icon?: IconName
    href?: string
    classes?: string[]
    click?: Packet
    badge?: string
}

/**
 * Options to pass to `render` that control how the actions are displayed.
 */
export type RenderActionOptions = {
    iconColor?: ColorName | null
    badgeColor?: ColorName
    defaultClass?: string
}

export default class Theme {
    
    renderIcon(parent: PartTag, icon: IconName, color?: ColorName | null): void {
        if (HubIcons.Names.includes(icon as HubIconName)) {
            HubIcons.renderIcon(parent, icon as HubIconName, color)
        }
        else { // a regular font icon
            const iconElem = parent.i('.icon', icon)
            if (color?.length) iconElem.class(color)
        }
    }

    renderCloseIcon(parent: PartTag, color?: ColorName | null): void {
        const classes = ['icon', 'glyp-close', 'close']
        if (color?.length) {
            classes.push(color)
        }
        parent.i(...classes)
    }

    getLoaderSrc(): string {
        return ""
    }

    /**
     * Renders one ore more `Action`s into a parent tag.
     * @param parent the HTML element in which to render the action
     * @param actions the action or actions to render
     * @param options additional rendering options
     */
    renderActions(parent: PartTag, actions: Action | Action[], options?: RenderActionOptions) {
        if (!Array.isArray(actions)) {
            actions = [actions]
        }
        for (const action of actions) {
            let iconColor = options?.iconColor
            const attrs = action.tooltip?.length ? {data: {tooltip: action.tooltip}} : {}
            parent.a(attrs, a => {
                const classes = action.classes || []
                if (classes?.length) {
                    a.class(...classes)
                } else if (options?.defaultClass?.length) {
                    a.class(options.defaultClass)
                }
                if (action.icon?.length) {
                    this.renderIcon(a, action.icon, iconColor)
                }
                if (action.title?.length) {
                    a.div('.title', {text: action.title})
                }
                else {
                    a.class('icon-only')
                }
                if (action.href?.length) {
                    a.attrs({href: action.href})
                }
                if (action.click) {
                    a.emitClick(action.click.key, action.click.data || {})
                }
                if (action.badge?.length) {
                    const badgeColor = options?.badgeColor || 'alert'
                    a.div(`.badge.${badgeColor}`, {text: action.badge})
                }
            })
        }
    }

}