import {PartTag} from "tuff-core/parts"
import DiveEditor, {DiveEditorState} from "./dive-editor"
import TerrierPart from "../../terrier/parts/terrier-part"
import {RegularSchedule, RegularScheduleForm} from "../../terrier/schedules"
import {Logger} from "tuff-core/logging"
import {EmailListForm} from "../../terrier/emails"

const log = new Logger("Dive Delivery")

export type DiveDeliverySettings = {
    delivery_schedule: RegularSchedule
    delivery_recipients: string[]
}

export class DiveDeliveryForm extends TerrierPart<DiveEditorState> {

    scheduleForm!: RegularScheduleForm
    recipientsForm!: EmailListForm

    async init() {
        const schedule = this.state.dive.delivery_schedule || {schedule_type: 'none'}
        this.scheduleForm = this.makePart(RegularScheduleForm, schedule)
        this.recipientsForm = this.makePart(EmailListForm, {emails: this.state.dive.delivery_recipients || []})

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
