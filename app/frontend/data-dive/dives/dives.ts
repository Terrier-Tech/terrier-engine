import {Query} from "../queries/queries"
import Api from "../../terrier/api"


export type Dive = {
    name: string
    queries: Query[]
}

async function get(id: string): Promise<Dive> {
    if (id == 'test') {
        const res = await Api.safeGet<{ dive: Dive }>(`/data_dive/test_dive.json`, {})
        return res.dive
    } else {
        throw `Don't know how to actually get queries`
    }
}


const Dives = {
    get
}

export default Dives