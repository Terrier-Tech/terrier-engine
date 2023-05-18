import {Part} from "tuff-core/parts"
import Theme from "@data-dive/dd-theme"
import {DdApp} from "@data-dive/app"

document.addEventListener('DOMContentLoaded', _ => {
    const container = document.getElementById('data-dive-container')
    if (container) {
        const theme = new Theme()
        Part.mount(DdApp, container, {theme}, {
            capturePath: '/data_dive'
        })
    } else {
        alert("No #data-dive-container!")
    }
})