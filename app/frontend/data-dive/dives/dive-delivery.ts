import {PartTag} from "tuff-core/parts"
import DiveEditor, {DiveEditorState} from "./dive-editor"
import TerrierPart from "../../terrier/parts/terrier-part"
import {RegularSchedule, RegularScheduleForm} from "../../terrier/schedules"
import {Logger} from "tuff-core/logging"
import {EmailListForm} from "../../terrier/emails"
import {DdDiveRun} from "../gen/models"
import Db from "../dd-db"
import dayjs from "dayjs"
import Dates from "../queries/dates"
import DiveRuns from "./dive-runs";
import Arrays from "tuff-core/arrays"

const log = new Logger("Dive Delivery")


////////////////////////////////////////////////////////////////////////////////
// Delivery Form
////////////////////////////////////////////////////////////////////////////////

export type DiveDeliverySettings = {
    delivery_schedule: RegularSchedule
    delivery_recipients: string[]
}

export class DiveDeliveryForm extends TerrierPart<DiveEditorState> {

    scheduleForm!: RegularScheduleForm
    recipientsForm!: EmailListForm
    deliveryList!: DiveDeliveryList

    async init() {
        const schedule = this.state.dive.delivery_schedule || {schedule_type: 'none'}
        this.scheduleForm = this.makePart(RegularScheduleForm, schedule)
        this.recipientsForm = this.makePart(EmailListForm, {emails: this.state.dive.delivery_recipients || []})
        this.deliveryList = this.makePart(DiveDeliveryList, this.state)

        this.listen('datachanged', this.scheduleForm.dataChangedKey, m => {
            log.info(`Schedule form data changed`, m.data)
            this.emitMessage(DiveEditor.diveChangedKey, {})
        })
        this.listenMessage(this.recipientsForm.changedKey, m => {
            log.info(`Recipients form data changed`, m.data)
            this.emitMessage(DiveEditor.diveChangedKey, {})
        })
    }


    get parentClasses(): Array<string> {
        return ['tt-flex', 'column', 'gap', 'dd-dive-tool', 'tt-typography']
    }

    render(parent: PartTag): any {
        parent.h3(".glyp-setup").text("Schedule")
        parent.part(this.scheduleForm)
        parent.h3(".glyp-users").text("Recipients")
        parent.part(this.recipientsForm)
        parent.div('.deliveries', deliveriesContainer => {
            // it looks better without the gap between the header and list
            deliveriesContainer.h3(".glyp-inbox").text("Deliveries")
            deliveriesContainer.part(this.deliveryList)
        })
    }

    /**
     * Serializes just the fields needed for the delivery settings.
     */
    async serialize(): Promise<DiveDeliverySettings> {
        const delivery_schedule = await this.scheduleForm.serializeConcrete()
        log.info(`Serialized ${delivery_schedule.schedule_type} delivery schedule`, delivery_schedule)
        const delivery_recipients = this.recipientsForm.state.emails
        return {delivery_schedule, delivery_recipients}
    }

}


////////////////////////////////////////////////////////////////////////////////
// Delivery List
////////////////////////////////////////////////////////////////////////////////

class DiveDeliveryList extends TerrierPart<DiveEditorState> {

    runs: DdDiveRun[] = []

    async init() {
        this.runs = await Db().query("dd_dive_run")
            .where({dd_dive_id: this.state.dive.id})
            .where("delivery_recipients is not null")
            .orderBy("created_at desc")
            .limit(100)
            .exec()

        this.dirty()
    }

    get parentClasses(): Array<string> {
        return ['dive-delivery-list']
    }

    render(parent: PartTag) {
        for (const run of this.runs) {
            parent.div(".run", view => {
                view.div(".recipients", recipientsList => {
                    if (run.delivery_recipients?.length) {
                        run.delivery_recipients.forEach((recipient) => {
                            recipientsList.div(".recipient.glyp-users.with-icon").text(recipient)
                        })
                    }
                    else {
                        // no recipients
                        recipientsList.div().text("No Recipients")
                    }
                })
                view.div('.datetime', dateTimeView => {
                    const d = dayjs(run.created_at)
                    dateTimeView.div(".date").text(d.format(Dates.displayFormat))
                    dateTimeView.div(".time").text(d.format("H:mm A"))
                })
                run.dd_dive = this.state.dive // so that the filename is better
                view.a(".download.glyp-download", {href: DiveRuns.outputUrl(run), target: '_blank'})
                    .data({tooltip: "Download the dive results for this delivery"})
            })
        }
    }

}

