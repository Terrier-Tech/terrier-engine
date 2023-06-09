import {Part, PartConstructor, PartTag, StatelessPart} from "tuff-core/parts"
import DdTheme, {DdThemeType} from "./dd-theme"
import {TerrierApp} from "../terrier/app"
import Theme from "./dd-theme"

export type DdAppState = {
    theme: DdTheme
    part: PartConstructor<any, { }>
}

export default class DdApp extends TerrierApp<DdAppState, DdThemeType, DdApp, DdTheme> {

    part!: StatelessPart

    async init() {
        await super.init()
        this.part = this.makePart(this.state.part, {})
        this.dirty()
    }

    get parentClasses(): Array<string> {
        return ['tt-typography']
    }

    render(parent: PartTag) {
        parent.part(this.part)
        parent.part(this.overlayPart)
    }

    static mountEntrypoint(part: PartConstructor<any, {}>, id: string) {
        const container = document.getElementById(id)
        if (container) {
            const theme = new Theme()
            Part.mount(DdApp, container, {theme, part})
        } else {
            alert(`No entrypoint container '#${id}'!`)
        }
    }
}
