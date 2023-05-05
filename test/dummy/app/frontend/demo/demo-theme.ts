import Theme, {ColorName, ThemeType} from "@terrier/theme"
import {PartTag} from "tuff-core/parts"


export interface DemoThemeType extends ThemeType {
    icons: 'foo' | 'bar'
}


export default class DemoTheme extends Theme<DemoThemeType> {
    colorValue(name: ColorName): string {
        return name;
    }

    renderIcon(parent: PartTag, icon: DemoThemeType['icons'], color: ColorName | undefined) {
        const classes: string[] = [icon]
        if (color?.length) {
            classes.push(color)
        }
        parent.i().class(...classes)
    }

}
