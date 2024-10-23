import {Part} from "tuff-core/parts"
import DdApp from "@data-dive/dd-app"

class DdDemoApp extends DdApp {
    docsAction() {
        const action = super.docsAction()
        action.classes = ['demo-docs']
        return action
    }
}

Part.mount(DdDemoApp, 'data-dive-app', {}, {
    capturePath: '/data_dive'
})