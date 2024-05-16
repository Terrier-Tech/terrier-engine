import {PartTag} from "tuff-core/parts"
import {DiveEditorState} from "./dive-editor"
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
    }


    get parentClasses(): Array<string> {
        return ['tt-flex', 'column', 'gap', 'dd-dive-tool', 'tt-typography']
    }

    render(parent: PartTag): any {
        parent.h3(".glyp-setup.text-center").text("Schedule")
        parent.part(this.scheduleForm)
        parent.h3(".glyp-users.text-center").text("Recipients")
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
