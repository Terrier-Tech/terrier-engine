import dayjs from "dayjs"
import * as inflection from "inflection"
import { Logger } from "tuff-core/logging"
import Messages from "tuff-core/messages"
import { PartTag } from "tuff-core/parts"
import { TerrierFormFields } from "./forms"
import TerrierPart from "./parts/terrier-part"

const log = new Logger("Schedules")


////////////////////////////////////////////////////////////////////////////////
// Types
////////////////////////////////////////////////////////////////////////////////


export type EmptySchedule = {
    schedule_type: 'none'
}

const HoursOfDay = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23'] as const

export type HourOfDay = typeof HoursOfDay[number]

const HourOfDayOptions = HoursOfDay.map(h => {
    return { value: h.toString(), title: dayjs().hour(parseInt(h)).format('h A') }
})

type BaseSchedule = {
    hour_of_day: HourOfDay
}

const DaysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const

export type DayOfWeek = typeof DaysOfWeek[number]

const DayOfWeekOptions = DaysOfWeek.map(d => {
    return { value: d.toString(), title: inflection.capitalize(d) }
})

export type DailySchedule = BaseSchedule & {
    schedule_type: 'daily'
}

export type WeeklySchedule = BaseSchedule & {
    schedule_type: 'weekly'
    day_of_week: DayOfWeek
}

const DaysOfMonth = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28'] as const

export type DayOfMonth = typeof DaysOfMonth[number]

const DayOfMonthOptions = DaysOfMonth.map(d => {
    return { value: d, title: inflection.ordinalize(d) }
})

export type MonthlySchedule = BaseSchedule & {
    schedule_type: 'monthly'
    day_of_month: DayOfMonth
}

/**
 * A schedule for something that happens on a regular daily/weekly/monthly basis.
 */
export type RegularSchedule = EmptySchedule | DailySchedule | WeeklySchedule | MonthlySchedule

export type ScheduleType = 'none' | 'daily' | 'weekly' | 'monthly'

/**
 * All possible variations of RegularSchedule.
 */
export type CombinedRegularSchedule = {
    schedule_type: ScheduleType
    hour_of_day?: HourOfDay
    day_of_week?: DayOfWeek
    day_of_month?: DayOfMonth
}


////////////////////////////////////////////////////////////////////////////////
// Form
////////////////////////////////////////////////////////////////////////////////

export class RegularScheduleFields extends TerrierFormFields<CombinedRegularSchedule> {

    scheduleTypeChangeKey = Messages.typedKey<{ schedule_type: ScheduleType }>()

    /**
     * Set false to not render the 'none' option
     */
    showNoneOption: boolean = true

    constructor(part: TerrierPart<any>, data: CombinedRegularSchedule) {
        super(part, data)

        this.part.onChange(this.scheduleTypeChangeKey, m => {
            log.info(`Schedule type changed to ${m.data.schedule_type}`)
            this.data = m.data
            this.part.dirty()
        })
    }

    render(parent: PartTag): any {
        parent.div('.tt-flex.column.gap.regular-schedule-form.tt-form', col => {
            if (this.showNoneOption) {
                col.label('.caption-size', label => {
                    this.radio(label, 'schedule_type', 'none')
                        .emitChange(this.scheduleTypeChangeKey, { schedule_type: 'none' })
                    label.span().text("Do Not Deliver")
                })
            }

            col.label('.caption-size', label => {
                this.radio(label, 'schedule_type', 'daily')
                    .emitChange(this.scheduleTypeChangeKey, { schedule_type: 'daily' })
                label.span().text("Deliver Daily")
            })
            if (this.data.schedule_type == 'daily') {
                col.div('.schedule-type-fields.daily.tt-flex.gap', row => {
                    this.select(row, 'hour_of_day', HourOfDayOptions)
                })
            }

            col.label('.caption-size', label => {
                this.radio(label, 'schedule_type', 'weekly')
                    .emitChange(this.scheduleTypeChangeKey, { schedule_type: 'weekly' })
                label.span().text("Deliver Weekly")
            })
            if (this.data.schedule_type == 'weekly') {
                col.div('.schedule-type-fields.weekly.tt-flex.gap', row => {
                    this.select(row, 'day_of_week', DayOfWeekOptions)
                        .data({ tooltip: "Day of the week" })
                    this.select(row, 'hour_of_day', HourOfDayOptions)
                })
            }

            col.label('.caption-size', label => {
                this.radio(label, 'schedule_type', 'monthly')
                    .emitChange(this.scheduleTypeChangeKey, { schedule_type: 'monthly' })
                label.span().text("Deliver Monthly")
            })
            if (this.data.schedule_type == 'monthly') {
                col.div('.schedule-type-fields.monthly.tt-flex.gap', row => {
                    this.select(row, 'day_of_month', DayOfMonthOptions)
                        .data({ tooltip: "Day of the month" })
                    this.select(row, 'hour_of_day', HourOfDayOptions)
                })
            }
        })
    }


    /**
     * Serializes the form into a RegularSchedule based on the selected schedule type.
     */
    async serializeConcrete(): Promise<RegularSchedule> {
        const raw = await this.serialize()
        const schedule_type = raw.schedule_type
        const hour_of_day = raw.hour_of_day || '0'
        log.info(`Serializing schedule type ${schedule_type}`, raw)
        switch (schedule_type) {
            case 'none':
                return { schedule_type }
            case 'daily':
                return { schedule_type, hour_of_day }
            case 'weekly':
                return { schedule_type, hour_of_day, day_of_week: raw.day_of_week ?? 'sunday' }
            case 'monthly':
                return { schedule_type, hour_of_day, day_of_month: raw.day_of_month ?? '1' }
            default:
                throw `Invalid schedule type: ${schedule_type}`
        }
    }

}


////////////////////////////////////////////////////////////////////////////////
// Display
////////////////////////////////////////////////////////////////////////////////

/**
 * Generate an english description of the given regular schedule.
 * @param schedule
 */
function describeRegular(schedule: CombinedRegularSchedule): string {
    const timeString = dayjs().hour(parseInt(schedule.hour_of_day || '0')).format('h A')
    switch (schedule.schedule_type) {
        case 'none':
            return "Unscheduled"
        case 'daily':
            return `Daily at ${timeString}`
        case 'weekly':
            return `Every ${inflection.titleize(schedule.day_of_week || 'sunday')} at ${timeString}`
        case 'monthly':
            return `Every ${inflection.ordinalize(schedule.day_of_month || '1')} of the month at ${timeString}`
        default:
            throw `Invalid schedule type: ${schedule.schedule_type}`
    }
}


////////////////////////////////////////////////////////////////////////////////
// Export
////////////////////////////////////////////////////////////////////////////////

const Schedules = {
    DaysOfWeek,
    DaysOfMonth,
    HoursOfDay,
    describeRegular
}
export default Schedules

