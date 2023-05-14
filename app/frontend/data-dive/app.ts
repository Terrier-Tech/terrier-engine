import {PartTag} from "tuff-core/parts"
import {DdThemeType} from "./dd-theme"
import {TerrierApp} from "../terrier/app"


export class App extends TerrierApp<DdThemeType> {
    render(parent: PartTag) {
        parent.h2({text: "Data-Dive 11"})
    }

}