import {Part, PartConstructor, PartTag, StatelessPart} from "tuff-core/parts"
import {TerrierApp} from "../terrier/app"

export type DdAppState = {
    part: PartConstructor<any, { }>
}

export default class DdApp extends TerrierApp<DdAppState> {

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
            Part.mount(DdApp, container, {part})
        } else {
            alert(`No entrypoint container '#${id}'!`)
        }
    }
}
