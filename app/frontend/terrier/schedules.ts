import dayjs from "dayjs"
import * as inflection from "inflection"
import Forms from "tuff-core/forms"
import { Logger } from "tuff-core/logging"
import Messages from "tuff-core/messages"
import { PartTag } from "tuff-core/parts"
import { TerrierFormFields } from "./forms"
import TerrierPart from "./parts/terrier-part"
import { unreachable } from "./utils"

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

export type WeekdailySchedule = BaseSchedule & {
    schedule_type: 'weekdaily'
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

export const MonthAnchors = {
    first_day: "First day",
    first_weekday: "First weekday",
    last_day: "Last day",
    last_weekday: "Last weekday",
} as const
export type MonthAnchor = keyof typeof MonthAnchors

const MonthAnchorOptions = Forms.objectToSelectOptions(MonthAnchors)

export type MonthAnchoredSchedule = BaseSchedule & {
    schedule_type: 'monthanchored'
    anchor: MonthAnchor
}

/**
 * A schedule for something that happens on a regular daily/weekly/monthly basis.
 */
export type RegularSchedule = EmptySchedule | DailySchedule | WeekdailySchedule | WeeklySchedule | MonthlySchedule | MonthAnchoredSchedule

export type ScheduleType = RegularSchedule['schedule_type']

const ScheduleTypeOptions = {
    none: "None",
    daily: "Daily",
    weekdaily: "Every Weekday",
    weekly: "Weekly",
    monthly: "Monthly",
    monthanchored: "Anchored Date",
} as const satisfies Record<ScheduleType, string>


////////////////////////////////////////////////////////////////////////////////
// Form
////////////////////////////////////////////////////////////////////////////////

export type RegularScheduleFieldsOptions = {
    // Show the option to select "none" schedule type (default true)
    showNoneOption?: boolean
    // Format the title of each schedule type option
    optionTitle?: (type: ScheduleType, title: string) => string
}

export class RegularScheduleFields extends TerrierFormFields<RegularSchedule> {

    scheduleTypeChangeKey = Messages.typedKey<{ schedule_type: ScheduleType }>()

    constructor(part: TerrierPart<any>, data: RegularSchedule, public options: RegularScheduleFieldsOptions = {}) {
        super(part, data)

        this.options.showNoneOption ??= true

        this.part.onChange(this.scheduleTypeChangeKey, m => {
            log.info(`Schedule type changed to ${m.data.schedule_type}`)
            this.data = m.data as RegularSchedule
            this.part.dirty()
        })
    }

    render(parent: PartTag): any {
        parent.div('.tt-flex.column.gap.regular-schedule-form.tt-form', col => {
            if (this.options.showNoneOption) {
                this.renderSection(col, 'none')
            }

            this.renderSection(col, 'daily')
            this.renderSection(col, 'weekdaily')
            this.renderSection(col, 'weekly')
            this.renderSection(col, 'monthly')
            this.renderSection(col, 'monthanchored')
        })
    }

    private renderSection(parent: PartTag, scheduleType: ScheduleType): void {
        parent.label('.caption-size', label => {
            this.radio(label, 'schedule_type', scheduleType)
                .emitChange(this.scheduleTypeChangeKey, { schedule_type: scheduleType })
            let optionTitle: string = ScheduleTypeOptions[scheduleType]
            if (this.options.optionTitle) {
                optionTitle = this.options.optionTitle(scheduleType, optionTitle)
            }
            label.span().text(optionTitle)
        })
        if (scheduleType != 'none' && this.data.schedule_type == scheduleType) {
            parent.div(`.schedule-type-fields.tt-flex.small-gap.align-center.shrink-items`, row => {
                row.class(scheduleType)

                switch (scheduleType) {
                    case "daily":
                    case "weekdaily":
                        this.renderDailyFields(row, this as TerrierFormFields<DailySchedule>)
                        break
                    case "weekly":
                        this.renderWeeklyFields(row, this as TerrierFormFields<WeeklySchedule>)
                        break
                    case "monthly":
                        this.renderMonthlyFields(row, this as TerrierFormFields<MonthlySchedule>)
                        break
                    case "monthanchored":
                        this.renderMonthAnchoredFields(row, this as TerrierFormFields<MonthAnchoredSchedule>)
                        break
                    default:
                        unreachable(scheduleType)
                }
            })
        }
    }

    private renderDailyFields(parent: PartTag, formFields: TerrierFormFields<DailySchedule>): void {
        formFields.select(parent, 'hour_of_day', HourOfDayOptions)
    }

    private renderWeeklyFields(parent: PartTag, formFields: TerrierFormFields<WeeklySchedule>): void {
        parent.span().text("Every")
        formFields.select(parent.div(), 'day_of_week', DayOfWeekOptions)
            .data({ tooltip: "Day of the week" })
        parent.span().text("at")
        formFields.select(parent.div(), 'hour_of_day', HourOfDayOptions)
    }

    private renderMonthlyFields(parent: PartTag, formFields: TerrierFormFields<MonthlySchedule>): void {
        formFields.select(parent.div(), 'day_of_month', DayOfMonthOptions)
            .data({ tooltip: "Day of the month" })
        parent.span().text("of every month at")
        formFields.select(parent.div(), 'hour_of_day', HourOfDayOptions)
    }

    private renderMonthAnchoredFields(parent: PartTag, formFields: TerrierFormFields<MonthAnchoredSchedule>): void {
        formFields.select(parent.div(), 'anchor', MonthAnchorOptions)
        parent.span().text("of every month at")
        formFields.select(parent.div(), 'hour_of_day', HourOfDayOptions)
    }


    /**
     * Serializes the form into a RegularSchedule based on the selected schedule type.
     */
    async serializeConcrete(): Promise<RegularSchedule> {
        const raw = await this.serialize()
        const schedule_type = raw.schedule_type

        log.info(`Serializing schedule type ${schedule_type}`, raw)

        if (schedule_type == 'none') {
            return { schedule_type }
        }

        const hour_of_day = raw.hour_of_day ?? '0'
        switch (schedule_type) {
            case 'daily':
            case 'weekdaily':
                return { schedule_type, hour_of_day }
            case 'weekly':
                return { schedule_type, hour_of_day, day_of_week: raw.day_of_week ?? 'sunday' }
            case 'monthly':
                return { schedule_type, hour_of_day, day_of_month: raw.day_of_month ?? '1' }
            case 'monthanchored':
                return { schedule_type, hour_of_day, anchor: raw.anchor ?? 'first_day' }
            default:
                unreachable(schedule_type)
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
function describeRegular(schedule: RegularSchedule): string {
    if (schedule.schedule_type == 'none') {
        return "Unscheduled"
    }

    const timeString = dayjs().hour(parseInt(schedule.hour_of_day ?? '0')).format('h A')
    switch (schedule.schedule_type) {
        case 'daily':
            return `Daily at ${timeString}`
        case 'weekdaily':
            return `Every Weekday at ${timeString}`
        case 'weekly':
            return `Every ${inflection.titleize(schedule.day_of_week ?? 'sunday')} at ${timeString}`
        case 'monthly':
            return `The ${inflection.ordinalize(schedule.day_of_month ?? '1')} of every month at ${timeString}`
        case 'monthanchored':
            const anchor = MonthAnchors[schedule.anchor ?? 'first_day'].toLocaleLowerCase()
            return `The ${anchor} of every month at ${timeString}`
        default:
            unreachable(schedule)
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

