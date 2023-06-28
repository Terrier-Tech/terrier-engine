import {DdUser} from "./dd-user"
import Api from "../terrier/api"


type DdSessionData = {
    user: DdUser
}

/**
 * Stores authentication information as well as various options from the server.
 */
export default class DdSession {

    constructor(readonly data: DdSessionData) {
    }

    static async get(): Promise<DdSession> {
        const data = await Api.safeGet<DdSessionData>("/data_dive/user_session.json", {})
        return new DdSession(data)
    }

}