import PagePart from "../../terrier/parts/page-part"
import Messages from "tuff-core/messages"


export abstract class DivePage<T> extends PagePart<T> {

    static docsKey = Messages.untypedKey()

    addDocsAction() {

        this.addAction({
            title: 'Docs',
            icon: 'glyp-help',
            click: {key: DivePage.docsKey},
            classes: ['data-dive-docs']
        }, 'tertiary')
    }

}