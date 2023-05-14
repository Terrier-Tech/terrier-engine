import Theme, {ThemeType} from "../terrier/theme"
import {PartTag} from "tuff-core/parts"
import {GlypName} from "../terrier/glyps"


const ColorNames = [
    'link', 'primary', 'secondary', 'active', 'pending', 'success', 'alert', 'white', 'inactive'
] as const

export type ColorName = typeof ColorNames[number]

export interface DdThemeType extends ThemeType {
    icons: GlypName
    colors: ColorName
}


export default class DdTheme extends Theme<DdThemeType> {
    colorValue(name: DdThemeType['colors']): string {
        return name;
    }

    renderIcon(parent: PartTag, icon: DdThemeType['icons'], color?: ColorName | null) {
        const classes: string[] = [icon]
        if (color?.length) {
            classes.push(color)
        }
        parent.i().class(...classes)
    }

    getLoaderSrc(): string {
        return "";
    }

    renderCloseIcon(parent: PartTag, _color?: DdThemeType["colors"] | null): void {
        // we don't have icons, just render an times
        parent.i('.glyp-close.close')
    }

}
