import {PartTag} from "tuff-core/parts"
import DiveEditor, {DiveEditorState} from "./dive-editor"
import TerrierPart from "../../terrier/parts/terrier-part"
import {RegularSchedule, RegularScheduleForm} from "../../terrier/schedules"
import {Logger} from "tuff-core/logging"

const log = new Logger("Dive Delivery")

export type DiveDeliverySettings = {
    delivery_schedule: RegularSchedule
    delivery_recipients: string[]
}

export class DiveDeliveryForm extends TerrierPart<DiveEditorState> {

    scheduleForm!: RegularScheduleForm

    async init() {
        const schedule = this.state.dive.delivery_schedule || {schedule_type: 'none'}
        this.scheduleForm = this.makePart(RegularScheduleForm, schedule)

        this.listen('datachanged', this.scheduleForm.dataChangedKey, m => {
            log.info(`Schedule form data changed`, m.data)
            this.emitMessage(DiveEditor.diveChangedKey, {})
        })
    }


    get parentClasses(): Array<string> {
        return ['tt-flex', 'column', 'gap', 'dd-dive-tool', 'tt-typography']
    }

    render(parent: PartTag): any {
        parent.h3(".glyp-setup").text("Schedule")
        parent.part(this.scheduleForm)
        // parent.div('.separator')
        parent.h3(".glyp-users").text("Recipients")
    }

    /**
     * Serializes just the fields needed for the delivery settings.
     */
    async serialize(): Promise<DiveDeliverySettings> {
        const delivery_schedule = await this.scheduleForm.serializeConcrete()
        log.info(`Serialized ${delivery_schedule.schedule_type} delivery schedule`, delivery_schedule)
        return {delivery_schedule, delivery_recipients: []}
    }

}
