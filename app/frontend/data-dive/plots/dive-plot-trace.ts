import {MarkerStyle, TraceStyle, TraceType, YAxisName} from "tuff-plot/trace";

/**
 * Similar to the tuff-plot Trace but not strongly typed to the data type since it's dynamically assigned to a query.
 */
export type DivePlotTrace = {
    id: string
    type: TraceType
    title: string
    query_id: string
    x: string
    y: string
    y_axis: YAxisName
    style?: TraceStyle
    marker?: MarkerStyle
}