import DdTheme, {DdThemeType} from "./dd-theme"
import ContentPart from "../terrier/parts/content-part"
import PagePart from "../terrier/parts/page-part"
import ThemedFormPart from "../terrier/parts/themed-form-part"
import {PartTag} from "tuff-core/parts"
import {ModalPart} from "../terrier/modals"
import {FormPartData} from "tuff-core/forms"
import {ActionsDropdown, Dropdown} from "../terrier/dropdowns"
import {TabContainerPart} from "../terrier/tabs"
import DdApp, {DdAppState} from "./dd-app"
import {Action} from "../terrier/theme"


export abstract class DdPagePart<T> extends PagePart<T, DdAppState, DdThemeType, DdApp, DdTheme> { }

export abstract class DdContentPart<T> extends ContentPart<T, DdAppState, DdThemeType, DdApp, DdTheme> {
    render(parent: PartTag): any {
        this.renderContent(parent)
    }
}

export abstract class DdModalPart<T> extends ModalPart<T, DdAppState, DdThemeType, DdApp, DdTheme> {

}

export abstract class DdFormPart<T extends FormPartData> extends ThemedFormPart<T, DdAppState, DdThemeType, DdApp, DdTheme> {

}

export abstract class DdDropdown<T extends {}> extends Dropdown<T, DdAppState, DdThemeType, DdApp, DdTheme> {

}

export class DdActionsDropdown extends ActionsDropdown<DdAppState, DdThemeType, DdApp, DdTheme> {

}

export class DdTabContainerPart extends TabContainerPart<DdAppState, DdThemeType, DdApp, DdTheme> {

}

export type DdAction = Action<DdThemeType>