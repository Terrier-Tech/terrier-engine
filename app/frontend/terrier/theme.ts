import {PartTag} from "tuff-core/parts"
import {messages} from "tuff-core"

export interface ThemeType {
    readonly icons: string
    readonly colors: string
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
export type Action<TT extends ThemeType> = {
    title?: string
    tooltip?: string
    icon?: TT['icons']
    href?: string
    classes?: string[]
    click?: Packet
    badge?: string
}

/**
 * Options to pass to `render` that control how the actions are displayed.
 */
export type RenderActionOptions<TT extends ThemeType> = {
    iconColor?: TT['colors'] | null
    badgeColor?: TT['colors']
    defaultClass?: string
}

export default abstract class Theme<TT extends ThemeType> {
    abstract renderIcon(parent: PartTag, icon: TT['icons'], color?: TT['colors'] | null): void

    abstract renderCloseIcon(parent: PartTag, color?: TT['colors'] | null): void

    abstract colorValue(name: TT['colors']): string

    abstract getLoaderSrc(): string

    /**
     * Renders one ore more `Action`s into a parent tag.
     * @param parent the HTML element in which to render the action
     * @param actions the action or actions to render
     * @param options additional rendering options
     */
    renderActions(parent: PartTag, actions: Action<TT> | Action<TT>[], options?: RenderActionOptions<TT>) {
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