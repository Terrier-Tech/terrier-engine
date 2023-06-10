import {FormPart, FormPartData} from "tuff-core/forms"
import Theme, {ThemeType} from "../theme"
import {TerrierApp} from "../app"

export default abstract class ThemedFormPart<
    TState extends FormPartData,
    TThemeType extends ThemeType,
    TApp extends TerrierApp<TThemeType, TApp, TTheme>,
    TTheme extends Theme<TThemeType>
> extends FormPart<TState> {


    get app(): TApp {
        return this.root as TApp // this should always be true
    }

    get theme(): TTheme {
        return this.app.theme
    }


    get parentClasses(): Array<string> {
        return ['tt-form']
    }
}