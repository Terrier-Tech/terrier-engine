import {ContentPart, PagePart} from "../terrier/parts"
import DdTheme, {DdThemeType} from "./dd-theme"
import {PartTag} from "tuff-core/parts"
import {DdApp} from "./app";


export abstract class DdPagePart<T> extends PagePart<T, DdThemeType, DdApp, DdTheme> { }

export abstract class DdContentPart<T> extends ContentPart<T, DdThemeType, DdApp, DdTheme> {
    render(parent: PartTag): any {
        this.renderContent(parent)
    }
}