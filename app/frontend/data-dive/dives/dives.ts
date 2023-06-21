import Api from "../../terrier/api"
import {DdDive} from "../gen/models"


async function get(id: string): Promise<DdDive> {
    if (id == 'test') {
        const res = await Api.safeGet<{ dive: DdDive }>(`/data_dive/test_dive.json`, {})
        return res.dive
    } else {
        throw `Don't know how to actually get queries`
    }
}

const Dives = {
    get
}

export default Dives