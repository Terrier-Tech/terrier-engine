import {DdUser} from "./dd-user"
import Api from "../terrier/api"
import {DdDiveGroup} from "./gen/models"
import {arrays} from "tuff-core";
import {SelectOptions} from "tuff-core/forms"


type DdSessionData = {
    user: DdUser
    groupMap: Record<string, DdDiveGroup>
}

/**
 * Stores authentication information as well as various options from the server.
 */
export default class DdSession {

    constructor(readonly data: DdSessionData) {
    }

    get user(): DdUser {
        return this.data.user
    }

    groupsInOrder(): DdDiveGroup[] {
        return arrays.sortBy(Object.values(this.data.groupMap), 'name')
    }

    groupOptions(): SelectOptions {
        return this.groupsInOrder().map(g => {
            return {title: g.name, value: g.id}
        })
    }

    static async get(): Promise<DdSession> {
        const data = await Api.safeGet<DdSessionData>("/data_dive/user_session.json", {})
        return new DdSession(data)
    }


}