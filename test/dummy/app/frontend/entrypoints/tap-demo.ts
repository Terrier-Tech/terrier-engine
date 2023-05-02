import {Part} from "tuff-core/parts";
import TapDemoApp from "../tap-demo/tap-demo-app";

console.log(`TAP Demo!`)

document.addEventListener('DOMContentLoaded', _ => {
    const container = document.getElementById('tap-demo-container')
    if (container) {
        Part.mount(TapDemoApp, container, {}, {
            capturePath: '/hub'
        })
    } else {
        alert("No #tap-demo-container!")
    }
})