import {expect, test} from 'vitest'
import Dates, {DateRange, LiteralDateRange, VirtualDateRange} from "../dates"

function testRangeDisplay(range: DateRange, expected: string) {
    expect(Dates.rangeDisplay(range)).toBe(expected)
}

test("virtual range display", () => {
    // days
    testRangeDisplay({
        period: 'day',
        relative: 0
    }, "Today")
    testRangeDisplay({
        period: 'day',
        relative: -1
    }, "Yesterday")
    testRangeDisplay({
        period: 'day',
        relative: 1
    }, "Tomorrow")

    // weeks
    testRangeDisplay({
        period: 'week',
        relative: 0
    }, "This week")
    testRangeDisplay({
        period: 'week',
        relative: -1
    }, "Last week")
    testRangeDisplay({
        period: 'week',
        relative: 1
    }, "Next week")
    testRangeDisplay({
        period: 'week',
        relative: -2
    }, "2 weeks ago")
    testRangeDisplay({
        period: 'week',
        relative: 2
    }, "2 weeks from now")

    // months
    testRangeDisplay({
        period: 'month',
        relative: 0
    }, "This month")

    // years
    testRangeDisplay({
        period: 'year',
        relative: 0
    }, "This year")
    testRangeDisplay({
        period: 'year',
        relative: -1
    }, "Last year")
    testRangeDisplay({
        period: 'year',
        relative: 1
    }, "Next year")
    testRangeDisplay({
        period: 'year',
        relative: -2
    }, "2 years ago")
    testRangeDisplay({
        period: 'year',
        relative: 2
    }, "2 years from now")
})

test("literal range display", () => {
    testRangeDisplay({
        min: '2023-12-01',
        max: undefined
    }, "On or after 12/01/23")

    testRangeDisplay({
        min: undefined,
        max: '2023-12-01'
    }, "On or before 11/30/23")

    testRangeDisplay({
        min: '2022-03-12',
        max: '2023-12-01'
    }, "Between 03/12/22 and 11/30/23")

    testRangeDisplay({
        min: '2022-03-12',
        max: '2022-03-13'
    }, "03/12/22")
})

// use a constant reference date so that we can test materialization
const today = '2023-05-12'

function testRangeMaterialization(virtualRange: VirtualDateRange, expectedRange: LiteralDateRange) {
    expect(Dates.materializeVirtualRange(virtualRange, today)).toMatchObject(expectedRange)
}

test("virtual range materialization", () => {
    // days
    testRangeMaterialization({
        period: 'day',
        relative: 0
    }, {
        min: today,
        max: '2023-05-13'
    })
    testRangeMaterialization({
        period: 'day',
        relative: -1
    }, {
        min: '2023-05-11',
        max: today
    })

    // weeks
    testRangeMaterialization({
        period: 'week',
        relative: 0
    }, {
        min: '2023-05-07',
        max: '2023-05-14'
    })
    testRangeMaterialization({
        period: 'week',
        relative: -1
    }, {
        min: '2023-04-30',
        max: '2023-05-07'
    })
    testRangeMaterialization({
        period: 'week',
        relative: 1
    }, {
        min: '2023-05-14',
        max: '2023-05-21'
    })

    // months
    testRangeMaterialization({
        period: 'month',
        relative: 0
    }, {
        min: '2023-05-01',
        max: '2023-06-01'
    })
    testRangeMaterialization({
        period: 'month',
        relative: -1
    }, {
        min: '2023-04-01',
        max: '2023-05-01'
    })
    testRangeMaterialization({
        period: 'month',
        relative: 1
    }, {
        min: '2023-06-01',
        max: '2023-07-01'
    })

    // years
    testRangeMaterialization({
        period: 'year',
        relative: 0
    }, {
        min: '2023-01-01',
        max: '2024-01-01'
    })
    testRangeMaterialization({
        period: 'year',
        relative: -1
    }, {
        min: '2022-01-01',
        max: '2023-01-01'
    })
    testRangeMaterialization({
        period: 'year',
        relative: 1
    }, {
        min: '2024-01-01',
        max: '2025-01-01'
    })
})