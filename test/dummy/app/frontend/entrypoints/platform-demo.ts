import {Part} from "tuff-core/parts"
import DemoApp from "../demo/demo-app"

const container = document.getElementById('demo-container')
if (container) {
    Part.mount(DemoApp, container, {}, {
        capturePath: '/hub'
    })
} else {
    alert("No #demo-container!")
}