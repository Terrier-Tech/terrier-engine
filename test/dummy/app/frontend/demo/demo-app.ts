import {TerrierApp} from "@terrier/app"
import {MountOptions, NoState, Part, PartConstructor, PartTag} from "tuff-core/parts"
import PagePart from "@terrier/parts/page-part"

/**
 * All demo pages should inherit from this.
 */
export abstract class DemoPage extends PagePart<NoState> {

    async init() {
        await super.init()

        this.addBreadcrumb({
            title: "Terrier Engine",
            icon: 'glyp-terrier',
            href: "/"
        })
    }
}

export type DemoAppState<T extends DemoPage> = {
    part: PartConstructor<T, NoState>
}

/**
 * Acts as the App for all demo pages.
 * Mount pages using `DemoApp.mountPage()` in the entrypoint.
 */
export default class DemoApp<T extends DemoPage> extends TerrierApp<DemoAppState<T>> {

    page!: T

    async init() {
        await super.init()

        this.page = this.makePart(this.state.part, {})
    }

    render(parent: PartTag): any {
        parent.div('.tt-demo.tt-typography.tt-form', container => {
            container.part(this.page)
        })
        parent.part(this.overlayPart)
    }

    static mountPage<PartType extends DemoPage>(partType: PartConstructor<PartType, NoState>, mountOptions?: MountOptions) {
        const container = document.getElementById('demo-container')
        if (container) {

            Part.mount(DemoApp, container, {part: partType}, mountOptions)
        } else {
            alert("No #demo-container!")
            throw("No #demo-container!")
        }
    }
}


