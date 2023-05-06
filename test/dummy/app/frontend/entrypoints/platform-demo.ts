import {Part} from "tuff-core/parts"
import DemoApp from "../demo/demo-app"
import DemoTheme from "../demo/demo-theme";

document.addEventListener('DOMContentLoaded', _ => {
    const container = document.getElementById('demo-container')
    if (container) {
        const theme = new DemoTheme()
        Part.mount(DemoApp, container, {theme}, {
            capturePath: '/hub'
        })
    } else {
        alert("No #demo-container!")
    }
})