import {ContentPart, PagePart} from "../terrier/parts"
import {DdThemeType} from "./dd-theme"
import {PartTag} from "tuff-core/parts"


export abstract class DdPagePart<T> extends PagePart<T, DdThemeType> {

}

export abstract class DdContentPart<T> extends ContentPart<T, DdThemeType> {
    render(parent: PartTag): any {
        this.renderContent(parent)
    }
}