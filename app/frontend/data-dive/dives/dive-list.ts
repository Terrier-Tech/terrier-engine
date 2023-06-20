import {Logger} from "tuff-core/logging"
import PagePart from "../../terrier/parts/page-part"
import {PartTag} from "tuff-core/parts"

const log = new Logger("DiveList")


////////////////////////////////////////////////////////////////////////////////
// List
////////////////////////////////////////////////////////////////////////////////

export class DiveListPage extends PagePart<{}> {

    async init() {
        this.setTitle("Data Dive")
        this.setIcon('glyp-data_dives')

        log.info("Loading data dive list")

        this.addAction({
            title: "New Dive",
            icon: 'glyp-plus_outline'
        }, 'tertiary')
    }

    renderContent(parent: PartTag): void {
        parent.div().text("Dive List")
    }

}