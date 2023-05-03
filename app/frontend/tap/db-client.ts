// noinspection JSUnusedGlobalSymbols

import {Logger} from "tuff-core/logging"
import Api, {ApiResponse} from "./api"

const log = new Logger('Db')
log.level = 'debug'

/**
 * Type that maps keys to other types.
 */
type ModelTypeMap = {
    [name: string]: any
}

type ModelIncludesMap<M extends ModelTypeMap> = Record<keyof M, any>

/**
 * Map of columns to values for the given model type.
 */
type WhereMap<M> = {
    [col in keyof M]?: unknown
}

/**
 * A raw SQL where clause with an arbitrary number of additional arguments.
 */
type WhereClause = {
    clause: string,
    args: unknown[]
}

/**
 * Generic type for a get response.
 */
type DbGetResponse<T> = {
    records: T[]
}

/**
 * Type for a count response.
 */
type DbCountResponse = {
    count: number
}

/**
 * Describes one or more associations to include (same as ActiveRecord `includes`).
 */
export type Includes<M extends ModelTypeMap, T extends keyof M, I extends ModelIncludesMap<M>> = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [rel in I[T]]?: Includes<M,any,any>
}

/**
 * Constructs an ActiveRecord query on the client side and executes it on the server.
 */
class ModelQuery<PM extends ModelTypeMap, T extends keyof PM & string, I extends ModelIncludesMap<PM>> {

    constructor(readonly modelType: T) {
    }

    private whereMaps = Array<WhereMap<PM[T]>>()
    private whereClauses = Array<WhereClause>()

    /**
     * Adds one or more filters to the query.
     * @param map a map of columns to scalar values.
     */
    where(map: WhereMap<PM[T]>): ModelQuery<PM,T,I>

    /**
     * Adds one or more filters to the query.
     * @param clause an arbitrary string WHERE clause
     * @param args any injected arguments into the clause string
     */
    where(clause: string, ...args: unknown[]): ModelQuery<PM,T,I>

    where(mapOrClause: WhereMap<PM[T]> | string, ...args: unknown[]): ModelQuery<PM,T,I> {
        if (typeof mapOrClause == 'object') {
            this.whereMaps.push(mapOrClause)
        } else {
            this.whereClauses.push({clause: mapOrClause, args})
        }
        return this
    }

    private _includes: Includes<PM,T,I> = {}

    /**
     * Add one or more ActiveRecord-style includes.
     * @param inc maps association names to potentially more association names, or empty objects.
     */
    includes(inc: Includes<PM,T,I>): ModelQuery<PM,T,I> {
        this._includes = {...inc, ...this._includes}
        return this
    }

    private _joins = Array<string>()

    /**
     * Adds an ActiveRecord-style joins statement.
     * @param join the association to join
     */
    joins(join: string): ModelQuery<PM,T,I> {
        this._joins.push(join)
        return this
    }

    private order = ''

    /**
     * Set an ORDER BY statement for the query.
     * @param order a SQL ORDER BY statement
     */
    orderBy(order: string): ModelQuery<PM,T,I> {
        this.order = order
        return this
    }

    private _limit = 0

    /**
     * Adds a result limit to the query.
     * @param max the query limit
     */
    limit(max: number): ModelQuery<PM,T,I> {
        this._limit = max
        return this
    }

    /**
     * Asynchronously execute the query on the server and returns the response.
     * Only returns on success, throws otherwise.
     */
    async exec(): Promise<PM[T][]> {
        const url = `/db/model/${this.modelType}.json`
        const body = {
            where_maps: this.whereMaps,
            where_clauses: this.whereClauses,
            includes: this._includes,
            joins: this._joins,
            limit: this._limit,
            order: this.order
        }
        log.debug(`Getting ${this.modelType} query at ${url} with body`, body)
        const res = await Api.safePost<DbGetResponse<PM[T]>>(url, body)
        return res.records
    }

    /**
     * Retrieves the first record.
     */
    async first(): Promise<PM[T] | undefined> {
        const records = await this.limit(1).exec()
        return records[0]
    }

    /**
     * Counts the number of records represented by the query.
     */
    async count(): Promise<number> {
        const url = `/db/model/${this.modelType}/count.json`
        const body = {
            where_maps: this.whereMaps,
            where_clauses: this.whereClauses,
            joins: this._joins
        }
        log.debug(`Counting ${this.modelType} query at ${url} with body`, body)
        const res = await Api.safePost<DbCountResponse>(url, body)
        return res.count
    }

}

/**
 * Generic database client that works with persisted and unpersisted type maps.
 * @template PM the type map for persisted model types
 * @template UM the type map for unpersisted model types
 * @template I the type map for model includes
 */
export default class DbClient<PM extends ModelTypeMap, UM extends ModelTypeMap, I extends ModelIncludesMap<PM>> {

    /**
     * Start a new query for the given model type.
     * @param modelType the camel_case name of the model
     */
    query<T extends keyof PM & string>(modelType: T) {
        return new ModelQuery<PM,T,I>(modelType)
    }


    /**
     * Fetches a single record by id.
     * Throws an error if the record doesn't exist.
     * @param modelType the camel_case name of the model
     * @param id the id of the record
     * @param includes relations to include in the returned object
     */
    async find<T extends keyof PM & string>(modelType: T, id: string, includes?: I[T]): Promise<PM[T]> {
        const query = new ModelQuery<PM,T,I>(modelType).where("id = ?", id)
        if (includes) {
            query.includes(includes)
        }
        const record = await query.first()
        if (record) {
            return record as PM[T]
        } else {
            throw new DbFindException(`No ${modelType} with id=${id}`)
        }
    }

    /**
     * Fetches a single record by id *or* slug.
     * Throws an error if the record doesn't exist.
     * @todo See if we can narrow the definition of T to only include models with a slug column.
     * @param modelType the camel_case name of the model
     * @param idOrSlug the id or slug of the record
     * @param includes relations to include in the returned object
     */
    async findByIdOrSlug<T extends keyof PM & string>(modelType: T, idOrSlug: string, includes?: I[T]): Promise<PM[T]> {
        const column = isUuid(idOrSlug) ? "id" : "slug"
        const query = new ModelQuery(modelType).where(`${column} = ?`, idOrSlug)
        if (includes) {
            query.includes(includes)
        }
        const record = await query.first()
        if (record) {
            return record as PM[T]
        } else {
            throw new DbFindException(`No ${modelType} with id or slug ${idOrSlug}`)
        }
    }


    /**
     * Updates the given record.
     * @param modelType the camel_case name of the model
     * @param record the record to update
     * @param includes relations to include in the returned record
     */
    async update<T extends keyof PM & string>(modelType: T, record: PM[T], includes: Includes<PM,T,I> = {}): Promise<DbUpsertResponse<PM,T> & ApiResponse> {
        const url = `/db/model/${modelType}/upsert.json`
        const body = {record, includes}
        log.debug(`Updating ${modelType} at ${url} with body`, body)
        return await Api.post<DbUpsertResponse<PM,T>>(url, body)
    }

    /**
     * Update the given record and assume it will succeed.
     * This call should be wrapped in a try/catch.
     * @param modelType the camel_case name of the model
     * @param record the record to update
     * @param includes relations to include in the returned record
     */
    async safeUpdate<T extends keyof PM & string>(modelType: T, record: PM[T], includes: Includes<PM,T,I> = {}): Promise<PM[T]> {
        const res = await this.update(modelType, record, includes)
        if (res.status == 'success') {
            return res.record
        } else if (res.record) {
            throw new DbSaveException<PM, T>(res.message, res.record as UM[T], res.errors)
        } else {
            throw `Error updating ${modelType}: ${res.message}`
        }
    }

    /**
     * Inserts a new record for the given model type.
     * @param modelType the camel_case name of the model
     * @param record the record to update
     * @param includes relations to include in the returned record
     */
    async insert<T extends keyof PM & string>(modelType: T, record: UM[T], includes: Includes<PM,T,I> = {}): Promise<DbUpsertResponse<PM,T> & ApiResponse> {
        const url = `/db/model/${modelType}/upsert.json`
        const body = {record, includes}
        log.debug(`Inserting ${modelType} at ${url} with body`, body)
        return await Api.post<DbUpsertResponse<PM,T>>(url, body)
    }

    /**
     * Inserts or updates a new record for the given model type,
     * depending on if it has an id.
     * @param modelType the camel_case name of the model
     * @param record the record to update
     * @param includes relations to include in the returned record
     */
    async upsert<T extends keyof PM & string>(modelType: T, record: UM[T], includes: Includes<PM,T,I> = {}) {
        const url = `/db/model/${modelType}/upsert.json`
        const body = {record, includes}
        log.debug(`Upserting ${modelType} at ${url} with body`, body)
        return await Api.post<DbUpsertResponse<PM,T>>(url, body)
    }

    /**
     * Upserts the given record and assume it will succeed.
     * This call should be wrapped in a try/catch.
     * @param modelType the camel_case name of the model
     * @param record the record to update
     * @param includes relations to include in the returned record
     */
    async safeUpsert<T extends keyof PM & string>(modelType: T, record: UM[T], includes: Includes<PM,T,I> = {}) {
        const res = await this.upsert(modelType, record, includes)
        if (res.status == 'success') {
            return res.record
        } else if (res.record)  {
            throw new DbSaveException<PM,T>(res.message, res.record as UM[T], res.errors)
        } else {
            throw `Error upserting ${modelType}: ${res.message}`
        }
    }
}



/**
 * The exception that gets raised when a find() call fails.
 */
class DbFindException extends Error {
    constructor(message: string) {
        super(message)
    }
}

export const UuidRegex = /[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}/gi

const CompleteUuidRegex = new RegExp(`^${UuidRegex.source}$`)

function isUuid(str: string): boolean {
    return !!str.match(CompleteUuidRegex)
}

/**
 * Base validation errors that aren't associated with a particular column.
 */
type DbBaseErrors = {
    base?: string[]
}

/**
 * Generic type of the errors object returned from ActiveRecord validations.
 */
type DbModelErrors<T extends {}> = {
    // either array of string errors or array of error objects on related records
    [col in keyof T]?: string[]
}


export type DbErrors<T extends {}> = DbModelErrors<T> & DbBaseErrors

/**
 * Generic type for a create or update response.
 */
type DbUpsertResponse<PM extends ModelTypeMap, T extends keyof PM & string> = SuccessfulDbUpsertResponse<PM,T> | UnsuccessfulDbUpsertResponse<PM,T>

type SuccessfulDbUpsertResponse<PM extends ModelTypeMap, T extends keyof PM & string> = ApiResponse & {
    status: 'success'
    record: PM[T]
}

type UnsuccessfulDbUpsertResponse<PM extends ModelTypeMap, T extends keyof PM & string> = ApiResponse & {
    status: 'error'
    errors: DbErrors<PM[T]>
    record?: PM[T]
}


/**
 * The exception that gets raised when an insert or update call fails.
 */
export class DbSaveException<UM extends ModelTypeMap, T extends keyof UM> extends Error {
    record?: UM[T]
    errors?: DbErrors<UM[T]>

    constructor(message: string, record?: UM[T], errors?: DbErrors<UM[T]>) {
        super(message)
        this.record = record
        this.errors = errors
    }

    log(message: string, logger: Logger | Console = window.console) {
        logger.error(message, "| message:", `"${this.message}"`, "| errors:", this.errors, "| record:", this.record)
    }
}

/**
 * Raised when a client-side validation fails (usually during form serialization)
 */
export class ValidationException<PM extends ModelTypeMap, T extends keyof PM> extends DbSaveException<PM,T> {
}
