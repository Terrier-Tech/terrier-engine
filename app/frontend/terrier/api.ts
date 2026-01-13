import {Logger} from "tuff-core/logging"
import {QueryParams, RawQueryParams} from "tuff-core/urls"
import {LogEntry} from "./logging"
import {ErrorEvent} from "./api-subscriber"
import Strings from "tuff-core/strings";
import dayjs from "dayjs";

const log = new Logger('Api')

////////////////////////////////////////////////////////////////////////////////
// Basic Requests
////////////////////////////////////////////////////////////////////////////////

/**
 * All API responses containing these fields.
 */
export type ApiResponse = {
    status: 'success' | 'error'
    message: string
}

/**
 * Exception that gets thrown when an API call fails.
 */
export class ApiException extends Error {
    constructor(message: string) {
        super(`ApiException: ${message}`)
    }
}

export type RequestFunc = <ResponseType>(url: string, config: RequestInit) => Promise<ResponseType>

/**
 * Decorates all API requests made by the `Api` module with the given decorator method.
 *
 * This can be dangerous and should be used sparingly! You can't remove a decorator once it has been added,
 * and decorators apply to _all_ API requests. It is most appropriate for adding ubiquitous parameters and headers,
 * such as authentication tokens.
 *
 * @param decorator a function that takes a request function and returns a decorated request function
 *
 * @example
 * // adds a decorator that logs the request parameters and response for every request.
 * Api.addRequestDecorator((inner) => async (url: string, config: RequestInit) => {
 *     console.log("before request:", url, config)
 *     const res = await inner(url, config)
 *     console.log("after request:", res)
 *     return res
 * })
 */
function addRequestDecorator(decorator: (inner: RequestFunc) => RequestFunc) {
    _decoratedRequest = decorator(_decoratedRequest)
}

let _decoratedRequest: RequestFunc = async <RequestType>(url: string, config: RequestInit) => {
    const response = await fetch(url, config)
    return await response.json() as RequestType
}

async function request<ResponseType>(url: string, config: RequestInit): Promise<ResponseType> {
    return await _decoratedRequest(url, config)
}

async function apiRequest<ResponseType>(url: string, config: RequestInit): Promise<ApiResponse & ResponseType> {
    const response = await request<{ status?: unknown, message?: string } & ResponseType>(url, config)

    if (response.status && typeof response.status == 'string' && (response.status == 'success' || response.status == 'error')) {
        return response as ApiResponse & ResponseType
    } else {
        // If response.status does not exist or is not a string, e.g. 200, 404, etc.
        throw new ApiException(response.message ?? "Unknown API Exception")
    }
}

/**
 * Performs a GET request for the given datatype.
 * This will only return if the response status=success, it will throw on error.
 * `ResponseType` does not need to include the `status` or `message` fields, this is handled automatically.
 * @param url the base URL for the request
 * @param params a set of parameters that will be added to the URL as a query string
 */
async function safeGet<ResponseType>(url: string, params: QueryParams | RawQueryParams): Promise<ResponseType> {
    const response = await get<ApiResponse & ResponseType>(url, params)
    if (response.status == 'error') {
        throw new ApiException(response.message)
    }
    return response
}

/**
 * Performs a GET request for the given datatype.
 * Unlike `safeGet`, this will return the result regardless of the response status.
 * `ResponseType` does not need to include the `status` or `message` fields, this is handled automatically.
 * @param url the base URL for the request
 * @param params a set of parameters that will be added to the URL as a query string
 */
async function get<ResponseType>(url: string, params: QueryParams | RawQueryParams): Promise<ResponseType> {
    if (!params.raw) {
        params = new QueryParams(params as RawQueryParams)
    }
    const fullUrl = (params as QueryParams).serialize(url)
    log.debug(`Getting ${fullUrl}`)
    return await apiRequest<ResponseType>(fullUrl, {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        }
    })
}

/**
 * Performs a POST API request for the given data type.
 * This will only return if the response status=success, it will throw on error.
 * `ResponseType` does not need to include the `status` or `message` fields, this is handled automatically.
 * @param url the URL of the API endpoint
 * @param body the body of the request (will be transmitted as JSON)
 */
async function safePost<ResponseType>(url: string, body: Record<string, unknown> | FormData): Promise<ResponseType> {
    log.debug(`Safe posting to ${url} with body`, body)
    const config: RequestInit = { method: 'POST' }
    if (body instanceof FormData) {
        config.body = body
    } else {
        config.body = JSON.stringify(body)
        config.headers = { 'Content-Type': 'application/json' }
    }
    const response = await apiRequest<ResponseType>(url, config)
    if (response.status == 'error') {
        throw new ApiException(response.message)
    }
    return response
}

/**
 * Performs a POST API request for the given data type.
 * Unlike `safePost`, this will return regardless of the status of the request.
 * The result will automatically include ApiResponse.
 * @param url the URL of the API endpoint
 * @param body the body of the request (will be transmitted as JSON)
 */
async function post<ResponseType>(url: string, body: Record<string, unknown> | FormData): Promise<ResponseType & ApiResponse> {
    log.debug(`Posting to ${url} with body`, body)
    const config: RequestInit = { method: 'POST' }
    if (body instanceof FormData) {
        config.body = body
    } else {
        config.body = JSON.stringify(body)
        config.headers = { 'Content-Type': 'application/json' }
    }
    return await request<ResponseType & ApiResponse>(url, config)
}

////////////////////////////////////////////////////////////////////////////////
// Query Params
////////////////////////////////////////////////////////////////////////////////

/**
 * Transforms the given object to a QueryParams compatible object.
 */
function objectToQueryParams(object: Record<string, unknown>, snakifyKeys: boolean = false): Record<string, string> {
    const raw: Record<string, string> = {}
    for (const [key, value] of Object.entries(object)) {
        const paramKey = snakifyKeys ? Strings.splitWords(key).map(w => w.toLowerCase()).join("_") : key

        if (dayjs.isDayjs(value)) {
            raw[paramKey] = value.format()
        } else if (value == undefined) {
            raw[paramKey] = ""
        } else {
            raw[paramKey] = value?.toString()
        }
    }
    return raw
}

////////////////////////////////////////////////////////////////////////////////
// Event Streams
////////////////////////////////////////////////////////////////////////////////


/**
 * Configure a `Streamer`.
 */
export type StreamOptions = {
    keepAlive?: boolean
}

export type noArgListener = () => any

type StreamLifecycle = 'close'

/**
 * Exposes a typesafe API for handling streaming responses using SSE.
 */
export class Streamer {

    sse!: EventSource
    lifecycleListeners: Record<StreamLifecycle, noArgListener[]> = {
        close: []
    }

    constructor(readonly url: string, readonly options: StreamOptions | undefined = undefined) {
        this.sse = new EventSource(url)

        // this is a special event sent by the ResponseStreamer on the server
        // to tell us that the request is done
        this.sse.addEventListener('_close', evt => {
            if (!this.options?.keepAlive) {
                log.debug(`Closing Streamer at ${url}`, evt)
                this.sse.close()
                for (const listener of this.lifecycleListeners['close']) {
                    listener()
                }
            }
        })
    }

    /**
     * Register a listener for events of the given type.
     * @param type
     * @param listener
     */
    on<T>(type: string, listener: (event: T) => any) {
        this.sse.addEventListener(type, event => {
            const data = JSON.parse(event.data) as T
            log.debug(`${type} event`, data)
            listener(data)
        })
        return this
    }

    /**
     * Listen specifically for log events.
     * @param listener
     */
    onLog(listener: (event: LogEntry) => any) {
        return this.on<LogEntry>('_log', listener)
    }

    /**
     * Listen specifically for error events.
     * @param listener
     */
    onError(listener: (event: ErrorEvent) => any) {
        return this.on<ErrorEvent>('_error', listener)
    }

    onClose(listener: noArgListener) {
        this.lifecycleListeners['close'].push(listener)
        return this
    }
}

/**
 * Creates a streaming response for the given endpoint.
 * @param url
 * @param options pass `keepAlive: true` to keep retrying the request
 * @return a `Streamer` on which you attach event handlers
 */
function stream(url: string, options: StreamOptions={}): Streamer {
    return new Streamer(url, options)
}


////////////////////////////////////////////////////////////////////////////////
// Export
////////////////////////////////////////////////////////////////////////////////

const Api = {
    safeGet,
    get,
    safePost,
    post,
    stream,
    addRequestDecorator,
    objectToQueryParams,
}
export default Api