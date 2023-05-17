import {expect, test} from 'vitest'
import Dates, {DateRange} from "../dates"

function testDateRange(range: DateRange, expected: string) {
    expect(Dates.rangeDisplay(range)).toBe(expected)
}

test("virtual date ranges", () => {
    // days
    testDateRange({
        period: 'day',
        relative: 0
    }, "Today")
    testDateRange({
        period: 'day',
        relative: -1
    }, "Yesterday")
    testDateRange({
        period: 'day',
        relative: 1
    }, "Tomorrow")

    // weeks
    testDateRange({
        period: 'week',
        relative: 0
    }, "This week")
    testDateRange({
        period: 'week',
        relative: -1
    }, "Last week")
    testDateRange({
        period: 'week',
        relative: 1
    }, "Next week")
    testDateRange({
        period: 'week',
        relative: -2
    }, "2 weeks ago")
    testDateRange({
        period: 'week',
        relative: 2
    }, "2 weeks from now")

    // months
    testDateRange({
        period: 'month',
        relative: 0
    }, "This month")

    // years
    testDateRange({
        period: 'year',
        relative: 0
    }, "This year")
    testDateRange({
        period: 'year',
        relative: -1
    }, "Last year")
    testDateRange({
        period: 'year',
        relative: 1
    }, "Next year")
    testDateRange({
        period: 'year',
        relative: -2
    }, "2 years ago")
    testDateRange({
        period: 'year',
        relative: 2
    }, "2 years from now")
})

test("literal data ranges", () => {
    testDateRange({
        min: '2023-12-01',
        max: undefined
    }, "On or after 12/01/23")

    testDateRange({
        min: undefined,
        max: '2023-12-01'
    }, "On or before 12/01/23")

    testDateRange({
        min: '2022-03-12',
        max: '2023-12-01'
    }, "Between 03/12/22 and 12/01/23")
})