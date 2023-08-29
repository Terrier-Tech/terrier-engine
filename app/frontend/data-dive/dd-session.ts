import {DdUser} from "./dd-user"
import Api from "../terrier/api"
import {DdDiveGroup} from "./gen/models"
import Arrays from "tuff-core/arrays"
import {SelectOptions} from "tuff-core/forms"
import {Logger} from "tuff-core/logging"

const log = new Logger("DD Session")

type DdSessionData = {
    user: DdUser
    groupMap: Record<string, DdDiveGroup>
}

const showHintsKey = 'dd-show-hints'

/**
 * Class that gets added to the body when hints shouldn't be shown.
 * Needs to be negative like this so we can just apply an !important and override any accidental display values.
 */
const hideHintsClass = 'dd-hide-hints'

/**
 * Stores authentication information as well as various options from the server.
 */
export default class DdSession {

    _showHints = false

    constructor(readonly data: DdSessionData) {
        // default to showing hints
        const rawShowHints = localStorage.getItem(showHintsKey)
        this._showHints = !rawShowHints || rawShowHints == 'true'
        this.updateShowHints()
    }

    /**
     * Whether to show the helpful hint bubbles all over the place.
     */
    get showHints() {
        return this._showHints
    }

    /**
     * Stores the showHints preference in localStorage.
     * @param val whether to show hints
     */
    set showHints(val: boolean) {
        this._showHints = val
        log.info(`Persisting ${showHintsKey} to ${val}`)
        localStorage.setItem(showHintsKey, val.toString())
        this.updateShowHints()
    }

    /**
     * Updates the DOM with the dd-show-hints class based on the value of this._showHints
     * @private
     */
    private updateShowHints() {
        const body = document.querySelector('body')
        if (body) {
            if (this._showHints) {
                body.classList.remove(hideHintsClass)
            } else {
                body.classList.add(hideHintsClass)
            }
        }
    }

    get user(): DdUser {
        return this.data.user
    }

    get isSuper(): boolean {
        return this.user.role == 'super'
    }

    groupsInOrder(): DdDiveGroup[] {
        return Arrays.sortBy(Object.values(this.data.groupMap), 'name')
    }

    groupOptions(): SelectOptions {
        return this.groupsInOrder().map(g => {
            return {title: g.name, value: g.id}
        })
    }

    /**
     * Gets user session information from the server.
     */
    static async get(): Promise<DdSession> {
        const data = await Api.safeGet<DdSessionData>("/data_dive/user_session.json", {})
        return new DdSession(data)
    }


}