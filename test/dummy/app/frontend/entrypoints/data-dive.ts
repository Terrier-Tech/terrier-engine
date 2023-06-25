import {Part} from "tuff-core/parts"
import DdApp from "@data-dive/dd-app"

Part.mount(DdApp, 'data-dive-app', {}, {
    capturePath: '/data_dive'
})