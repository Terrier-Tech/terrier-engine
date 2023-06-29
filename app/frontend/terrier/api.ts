import { Logger } from "tuff-core/logging"
import { QueryParams } from "tuff-core/urls"

const log = new Logger('Api')
log.level = 'debug'


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

async function request<ResponseType>(url: string, config: RequestInit): Promise<ResponseType> {
    const response = await fetch(url, config)
    return await response.json()
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
async function safeGet<ResponseType>(url: string, params: QueryParams | Record<string, string | undefined>): Promise<ResponseType> {
    if (!params.raw) {
        params = new QueryParams(params as Record<string, string>)
    }
    const fullUrl = (params as QueryParams).serialize(url)
    log.debug(`Safe getting ${fullUrl}`)
    const response = await apiRequest<ResponseType>(fullUrl, {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        }
    })
    if (response.status == 'error') {
        throw new ApiException(response.message)
    }
    return response
}

/**
 * Performs a POST API request for the given data type.
 * This will only return if the response status=success, it will throw on error.
 * `ResponseType` does not need to include the `status` or `message` fields, this is handled automatically.
 * @param url the URL of the API endpoint
 * @param body the body of the request (will be transmitted as JSON)
 */
async function safePost<ResponseType>(url: string, body: Record<string, unknown>): Promise<ResponseType> {
    log.debug(`Safe posting to ${url} with body`, body)
    const response = await apiRequest<ResponseType>(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })
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
    const config = { method: 'POST' } as RequestInit
    if (body instanceof FormData) {
        config.body = body
    } else {
        config.body = JSON.stringify(body)
        config.headers = { 'Content-Type': 'application/json' }
    }
    return await request<ResponseType & ApiResponse>(url, config)
}


////////////////////////////////////////////////////////////////////////////////
// Event Streams
////////////////////////////////////////////////////////////////////////////////

type LogLevel = 'success' | 'info' | 'warn' | 'debug'

/**
 * Type of log events from a streaming response.
 */
export type LogEvent = {
    level: LogLevel
    prefix?: string
    message: string
}

/**
 * Type of error events from a streaming response.
 */
export type ErrorEvent = {
    prefix?: string
    message: string
    backtrace: string[]
}

/**
 * Configure a `Streamer`.
 */
export type StreamOptions = {
    keepAlive?: boolean
}

/**
 * Exposes a typesafe API for handling streaming responses using SSE.
 */
export class Streamer {

    sse!: EventSource

    constructor(readonly url: string, readonly options: StreamOptions) {
        this.sse = new EventSource(url)

        // this is a special event sent by the ResponseStreamer on the server
        // to tell us that the request is done
        this.sse.addEventListener('_close', evt => {
            if (!this.options.keepAlive) {
                log.debug(`Closing Streamer at ${url}`, evt)
                this.sse.close()
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
    onLog(listener: (event: LogEvent) => any) {
        return this.on<LogEvent>('_log', listener)
    }

    /**
     * Listen specifically for error events.
     * @param listener
     */
    onError(listener: (event: ErrorEvent) => any) {
        return this.on<ErrorEvent>('_error', listener)
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
    safePost,
    post,
    stream
}
export default Api