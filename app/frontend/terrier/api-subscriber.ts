import Api, {ApiResponse, noArgListener, Streamer} from "./api"
import {LogEntry} from "./logging"
import dayjs from "dayjs"
import duration from "dayjs/plugin/duration"

dayjs.extend(duration)

/** Configuration for ApiSubscribers */
export type SubscriptionOptions = {
    /** If true, retry the subscription after it is cancelled */
    keepAlive?: boolean
}

/** Options specific to Subscribers that use GET HTTP requests */
export type GetSubscriberOptions = {
    /** If true, keys in the params object will be snakified before being sent to the server */
    snakifyKeys?: boolean
}

/** Parameters to send with the subscription request */
export type SubscriptionParams = Record<string, unknown>

export type SubscriptionEventHandlers<TResult> = {
    onResult: resultListener<TResult>[]
    onError: errorListener[]
    onLog: logListener[]
}

export type SubscriptionLifecycleHandlers = {
    onSubscribe: noArgListener[]
    onUnsubscribe: noArgListener[]
    onClose: closeListener[]
}

type resultListener<TResult> = (result: ResultEvent<TResult>) => boolean
type errorListener = (result: ErrorEvent) => boolean
type logListener = (log: LogEvent) => void
type closeListener = (reason?: string) => void


type BaseSubscriptionEvent = {
    _type: '_result' | '_error' | '_log' | '_close' | undefined
}

export type SubscriptionEvent<TResult> = BaseSubscriptionEvent & (ResultEvent<TResult> | ErrorEvent | LogEvent | CloseEvent)

/** Type of result events from a subscription */
export type ResultEvent<TResult> = BaseSubscriptionEvent & { _type: '_result' | undefined } & TResult

/** Type of error events from a subscription */
export type ErrorEvent = BaseSubscriptionEvent & { _type: '_error' } & {
    prefix?: string
    message: string
    backtrace: string[]
}

/** Type of log events from a subscription */
export type LogEvent = BaseSubscriptionEvent & { _type: '_log' } & LogEntry

export type CloseEvent = BaseSubscriptionEvent & { _type: '_close' }

/**
 * An abstraction over the process of receiving continuous updates from the server.
 * This allows client code to specify a dependency on continuous updates of a particular type without needing
 * to care about how those updates are fulfilled.
 *
 * Behind the scenes, this could be handled by pulling from the client (PollingSubscriber),
 * pushing from the server (CableSubscriber), or a hybrid of the two (StreamingSubscriber).
 *
 * Subclasses are responsible for implementing the process of initiating and finalizing the subscription and
 * passing events to the appropriate handlers.
 *
 * Each subclass is responsible for providing a constructor with whatever dependencies are required, but all subclasses
 * must implement `params` and `options` properties and handle them appropriately.
 */
export abstract class ApiSubscriber<TResult, TParams extends SubscriptionParams> {

    public abstract params: TParams
    public abstract options?: SubscriptionOptions

    protected isSubscribed: boolean = false

    protected eventHandlers: SubscriptionEventHandlers<TResult> = { onResult: [], onError: [], onLog: [] }
    protected lifecycleHandlers: SubscriptionLifecycleHandlers = { onSubscribe: [], onUnsubscribe: [], onClose: [] }
    protected otherHandlers: Record<string, ((event: unknown) => boolean | void)[]> = {}

    // Handler registration

    /** Register a handler for a custom event type */
    public on<EventType>(eventType: string, handler: (event: EventType) => boolean | void): this {
        if (eventType in ['_result', '_error', '_log', '_close']) {
            throw new Error(`${eventType} is a reserved handler type. Please use a different type or use the appropriate handler registration function.`)
        }

        this.otherHandlers[eventType] ??= []
        this.otherHandlers[eventType].push(handler as (event: unknown) => boolean | void)
        return this
    }

    /** Register a handler for the default result type of this subscriber */
    public onResult(handler: (result: ResultEvent<TResult>) => boolean): this {
        this.eventHandlers.onResult.push(handler)
        return this
    }

    /** Register a handler for error events */
    public onError(handler: (error: ErrorEvent) => boolean): this {
        this.eventHandlers.onError.push(handler)
        return this
    }

    /** Register a handler for log events */
    public onLog(handler: (logEntry: LogEvent) => void): this {
        this.eventHandlers.onLog.push(handler)
        return this
    }

    /** Register a handler to be notified when this subscriber is subscribed */
    public onSubscribe(handler: () => void): this {
        return this.onLifecycle('onSubscribe', handler)
    }

    /** Register a handler to be notified when this subscriber is manually unsubscribed */
    public onUnsubscribe(handler: () => void): this {
        return this.onLifecycle('onUnsubscribe', handler)
    }

    /** Register a handler to be notified when the publisher source of this subscriber closes the subscription */
    public onClose(handler: () => void): this {
        return this.onLifecycle('onClose', handler)
    }

    /** utility to register a generic lifecycle handler */
    protected onLifecycle(key: keyof SubscriptionLifecycleHandlers, handler: noArgListener): this
    protected onLifecycle(key: 'onClose', handler: (reason?: string) => void): this
    protected onLifecycle(key: keyof SubscriptionLifecycleHandlers, handler: noArgListener | ((reason?: string) => void)): this {
        this.lifecycleHandlers[key].push(handler)
        return this
    }

    // Start or stop subscription

    /**
     * Starts the subscription. Calling this after the subscription has already been started has no effect
     */
    public subscribe(): this {
        if (this.isSubscribed) return this
        this.subscribeImpl()
        this.isSubscribed = true
        this.notifyLifecycle('onSubscribe')
        return this
    }

    /** Stops the subscription and closes the connection. */
    public unsubscribe(): void {
        if (!this.isSubscribed) return
        this.unsubscribeImpl()
        this.isSubscribed = false
        this.notifyLifecycle('onUnsubscribe')
    }

    // Modify subscription params

    /** Update the params of this subscriber. Depending on the implementation, this may restart the subscription. */
    public abstract updateParams(newParams: TParams): void

    // Internal

    protected close() {
        this.isSubscribed = false
    }

    /** Call the handlers for the given lifecycle event */
    protected notifyLifecycle(key: keyof SubscriptionLifecycleHandlers): void
    protected notifyLifecycle(key: 'onClose', reason: string | undefined): void
    protected notifyLifecycle(key: keyof SubscriptionLifecycleHandlers, reason: string | undefined = undefined): void {
        if (key == 'onClose') {
            this.lifecycleHandlers[key].forEach(handler => handler(reason))
        } else {
            this.lifecycleHandlers[key].forEach(handler => handler())
        }
    }

    protected notifyResult(event: ResultEvent<TResult>) {
        const shouldContinue = this.eventHandlers.onResult
            .map(handler => handler(event))
            .every(b => b)
        if (!shouldContinue) this.unsubscribe()
    }

    protected notifyError(event: ErrorEvent) {
        const shouldContinue = this.eventHandlers.onError
            .map(handler => handler(event))
            .every(b => b)
        if (!shouldContinue) this.unsubscribe()
    }

    protected notifyLog(event: LogEvent) {
        this.eventHandlers.onLog.forEach(handler => handler(event))
    }

    protected notifyOther(key: string, event: any) {
        const shouldContinue = this.otherHandlers[key]
            .map(handler => handler(event) !== false)
            .every(b => b)
        if (!shouldContinue) this.unsubscribe()
    }

    /** Subclasses implement this method to start the subscription */
    protected abstract subscribeImpl(): void

    /** Subclasses implement this method to end the subscription */
    protected abstract unsubscribeImpl(): void
}

////////////////////////////////////////////////////////////////////////////////
// Polling Subscriber
////////////////////////////////////////////////////////////////////////////////

/**
 * An implementation of ApiSubscriber that uses polling to periodically make a request to the server
 */
export class PollingSubscriber<TResult, TParams extends SubscriptionParams> extends ApiSubscriber<TResult, TParams> {

    // used to ensure we only schedule one interval at a time and allows for cancellation.
    private timeoutHandle: NodeJS.Timeout | null = null

    /**
     * @param url the url to make a request to.
     * @param params params to use to make the request.
     * @param interval the interval on which to poll. Either a number of milliseconds or a dayjs Duration.
     * @param options extra subscription options
     */
    constructor(
        public url: string,
        public params: TParams,
        public interval: number | duration.Duration,
        public options: (SubscriptionOptions & GetSubscriberOptions) | undefined = undefined
    ) {
        super()
    }

    subscribeImpl() {
        if (this.timeoutHandle) return
        this.makeRequest()
    }

    unsubscribeImpl() {
        this.clearTimeout()
    }

    updateParams(newParams: TParams) {
        this.params = newParams
        this.makeRequest()
    }

    private makeRequest() {
        this.clearTimeout()
        this.request().then(response => {
            if ('events' in response) {
                for (const event of response.events) {
                   this.handleEvent(event)
                }
            } else {
                if (response.status == 'error') response._type = '_error'
                this.handleEvent(response)
            }

            this.startTimeout()
        })
    }

    protected request(): Promise<((ApiResponse & SubscriptionEvent<TResult>) | { events: SubscriptionEvent<TResult>[] })> {
        const params = Api.objectToQueryParams(this.params, this.options?.snakifyKeys)
        params._polling = true.toString()
        return Api.get<((ApiResponse & SubscriptionEvent<TResult>) | { events: SubscriptionEvent<TResult>[] })>(this.url, params)
    }

    protected handleEvent(event: SubscriptionEvent<TResult>) {
        switch (event._type) {
            case '_result':
            case undefined:
                this.notifyResult(event)
                break
            case '_error':
                this.notifyError(event)
                break
            case '_log':
                this.notifyLog(event)
                break
            case '_close':
                this.notifyLifecycle('onClose')
                this.close()
                break
            default:
                const otherEvent = event as any
                this.notifyOther(otherEvent._type, otherEvent)
        }
    }

    protected clearTimeout() {
        if (this.timeoutHandle) {
            clearTimeout(this.timeoutHandle)
            this.timeoutHandle = null
        }
    }

    protected startTimeout() {
        if (!this.isSubscribed) return
        if (this.timeoutHandle) return
        const intervalMs = (dayjs.isDuration(this.interval)) ? this.interval.asMilliseconds() : this.interval
        this.timeoutHandle = setTimeout(this.makeRequest.bind(this), intervalMs)
    }
}

////////////////////////////////////////////////////////////////////////////////
// Action Cable Subscriber
////////////////////////////////////////////////////////////////////////////////

/**
 * An ApiSubscriber that uses ActionCable to get pushed results from the server.
 * Not implemented yet
 */
export class CableSubscriber<TResult, TParams extends SubscriptionParams> extends ApiSubscriber<TResult, TParams> {

    constructor(
        public channelName: string,
        public params: TParams,
        public options: SubscriptionOptions | undefined = undefined
    ) {
        throw new Error("Method not implemented.")
        super()
    }

    public updateParams(_newParams: TParams): void {
        throw new Error("Method not implemented.")
    }
    protected subscribeImpl(): void {
        throw new Error("Method not implemented.")
    }
    protected unsubscribeImpl(): void {
        throw new Error("Method not implemented.")
    }
}

////////////////////////////////////////////////////////////////////////////////
// Event Stream Subscriber
////////////////////////////////////////////////////////////////////////////////

export class StreamingSubscriber<TResult, TParams extends SubscriptionParams> extends ApiSubscriber<TResult, TParams> {

    private streamer?: Streamer

    constructor(
        public url: string,
        public params: TParams,
        public options: (SubscriptionOptions & GetSubscriberOptions) | undefined = undefined,
    ) {
        super()
    }

    public on<EventType>(eventType: string, handler: (event: EventType) => boolean | void): this {
        if (!(eventType in this.otherHandlers) && this.streamer) {
            this.listenOther(eventType, this.streamer)
        }
        return super.on(eventType, handler)
    }

    public updateParams(newParams: TParams): void {
        this.unsubscribeImpl()
        this.params = newParams
        this.subscribeImpl()
    }

    protected subscribeImpl(): void {
        const params = Api.objectToQueryParams(this.params, this.options?.snakifyKeys)
        const paramsString = new URLSearchParams(params).toString()
        const streamer = new Streamer(`${this.url}?${paramsString}`, this.options ?? {})

        streamer
            .on<ResultEvent<TResult>>('_result', this.notifyResult.bind(this))
            .on<ErrorEvent>('_error', this.notifyError.bind(this))
            .on<LogEvent>('_log', this.notifyLog.bind(this))
            .onClose(() => {
                this.close()
                this.notifyLifecycle('onClose')
            })

        Object.keys(this.otherHandlers).forEach(key => {
            this.listenOther(key, streamer)
        })

        this.streamer = streamer
    }

    protected unsubscribeImpl(): void {
        this.streamer?.sse.close()
        this.streamer = undefined
    }

    protected listenOther(key: string, streamer: Streamer) {
        streamer.on(key, (event) => this.notifyOther(key, event))
    }
}
