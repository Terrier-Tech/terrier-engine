import {FormPart, FormPartData} from "tuff-core/forms"
import Theme from "../theme"
import {TerrierApp} from "../app"


/**
 * Form part that implements the Terrier platform methods like `app` and `theme`.
 */
export default abstract class TerrierFormPart<TState extends FormPartData> extends FormPart<TState> {

    get app(): TerrierApp<any> {
        return this.root as unknown as TerrierApp<any> // this should always be true
    }

    get theme(): Theme {
        return this.app.theme
    }


    get parentClasses(): Array<string> {
        return ['tt-form']
    }
}