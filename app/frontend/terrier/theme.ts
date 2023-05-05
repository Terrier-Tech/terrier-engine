import {PartTag} from "tuff-core/parts"
import {messages} from "tuff-core"

const ColorNames = [
    'link', 'primary', 'secondary', 'active', 'pending', 'success', 'alert', 'white', 'inactive'
] as const

export type ColorName = typeof ColorNames[number]

export interface ThemeType {
    icons: string
}


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
export type Action<T extends ThemeType> = {
    title?: string
    tooltip?: string
    icon?: T['icons']
    href?: string
    classes?: string[]
    click?: Packet
    badge?: string
}

/**
 * Options to pass to `render` that control how the actions are displayed.
 */
export type RenderActionOptions = {
    iconColor?: ColorName
    badgeColor?: ColorName
    defaultClass?: string
}

export default abstract class Theme<T extends ThemeType> {
    abstract renderIcon(parent: PartTag, icon: T['icons'], color?: ColorName): void

    abstract colorValue(name: ColorName): string

    /**
     * Renders one ore more `Action`s into a parent tag.
     * @param parent the HTML element in which to render the action
     * @param actions the action or actions to render
     * @param options additional rendering options
     */
    renderAction(parent: PartTag, actions: Action<T> | Action<T>[], options?: RenderActionOptions) {
        if (!Array.isArray(actions)) {
            actions = [actions]
        }
        for (const action of actions) {
            let iconColor = options?.iconColor
            const attrs = action.tooltip?.length ? {data: {tooltip: action.tooltip}} : {}
            parent.a(attrs, a => {
                if (action.classes?.length) {
                    a.class(...action.classes)
                } else if (options?.defaultClass?.length) {
                    a.class(options.defaultClass)
                }
                if (action.icon?.length) {
                    this.renderIcon(a, action.icon, iconColor)
                }
                if (action.title?.length) {
                    a.div('.title', {text: action.title})
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