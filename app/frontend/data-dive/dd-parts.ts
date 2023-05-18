import {ContentPart, PagePart, ThemedFormPart} from "../terrier/parts"
import DdTheme, {DdThemeType} from "./dd-theme"
import {PartTag} from "tuff-core/parts"
import {ModalPart} from "../terrier/modals"
import {FormPartData} from "tuff-core/forms"
import {DdApp} from "./app"


export abstract class DdPagePart<T> extends PagePart<T, DdThemeType, DdApp, DdTheme> { }

export abstract class DdContentPart<T> extends ContentPart<T, DdThemeType, DdApp, DdTheme> {
    render(parent: PartTag): any {
        this.renderContent(parent)
    }
}

export abstract class DdModalPart<T> extends ModalPart<T, DdThemeType, DdApp, DdTheme> {

}

export abstract class DdFormPart<T extends FormPartData> extends ThemedFormPart<T, DdThemeType, DdApp, DdTheme> {

}