import PagePart from "../../terrier/parts/page-part"
import Messages from "tuff-core/messages"
import DdApp from "../dd-app"


export abstract class DivePage<T> extends PagePart<T> {

    static docsKey = Messages.untypedKey()

    /**
     * Add the docs action to the page.
     */
    addDocsAction() {
        const app = this.app as DdApp
        this.addAction(app.docsAction(), 'tertiary')
    }

}