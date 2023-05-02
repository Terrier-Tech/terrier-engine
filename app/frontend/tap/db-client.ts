// noinspection JSUnusedGlobalSymbols

import {Logger} from "tuff-core/logging"
import Api, {ApiResponse} from "./api"
import {OptionalProps} from "tuff-core/types";

const log = new Logger('Db')
log.level = 'debug'

type ModelTypeMap = Record<string, object>
// type ModelTypeMap = {
//     [Property in keyof ModelTypeMap]: boolean;
// }

type ModelIncludesMap<M extends ModelTypeMap> = Record<keyof M, any>

type Unpersisted<T extends Record<string,any>> = OptionalProps<T, 'created_at' | 'id' | 'updated_at'>

/**
 * Map of columns to values for the given model type.
 */
type WhereMap<M extends ModelTypeMap, T extends keyof M> = {
    [col in keyof M[T]]?: unknown
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
    [rel in I[T]]?: Includes<any,any,any>
}

/**
 * Constructs an ActiveRecord query on the client side and executes it on the server.
 */
class ModelQuery<M extends ModelTypeMap, T extends keyof M & string, I extends ModelIncludesMap<M>> {

    constructor(readonly modelType: T) {
    }

    private whereMaps = Array<WhereMap<M,T>>()
    private whereClauses = Array<WhereClause>()

    /**
     * Adds one or more filters to the query.
     * @param map a map of columns to scalar values.
     */
    where(map: WhereMap<M,T>): ModelQuery<M,T,I>

    /**
     * Adds one or more filters to the query.
     * @param clause an arbitrary string WHERE clause
     * @param args any injected arguments into the clause string
     */
    where(clause: string, ...args: unknown[]): ModelQuery<M,T,I>

    where(mapOrClause: WhereMap<M,T> | string, ...args: unknown[]): ModelQuery<M,T,I> {
        if (typeof mapOrClause == 'object') {
            this.whereMaps.push(mapOrClause)
        } else {
            this.whereClauses.push({clause: mapOrClause, args})
        }
        return this
    }

    private _includes: Includes<M,T,I> = {}

    /**
     * Add one or more ActiveRecord-style includes.
     * @param inc maps association names to potentially more association names, or empty objects.
     */
    includes(inc: Includes<M,T,I>): ModelQuery<M,T,I> {
        this._includes = {...inc, ...this._includes}
        return this
    }

    private _joins = Array<string>()

    /**
     * Adds an ActiveRecord-style joins statement.
     * @param join the association to join
     */
    joins(join: string): ModelQuery<M,T,I> {
        this._joins.push(join)
        return this
    }

    private order = ''

    /**
     * Set an ORDER BY statement for the query.
     * @param order a SQL ORDER BY statement
     */
    orderBy(order: string): ModelQuery<M,T,I> {
        this.order = order
        return this
    }

    private _limit = 0

    /**
     * Adds a result limit to the query.
     * @param max the query limit
     */
    limit(max: number): ModelQuery<M,T,I> {
        this._limit = max
        return this
    }

    /**
     * Asynchronously execute the query on the server and returns the response.
     * Only returns on success, throws otherwise.
     */
    async exec(): Promise<M[T][]> {
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
        const res = await Api.safePost<DbGetResponse<M[T]>>(url, body)
        return res.records
    }

    /**
     * Retrieves the first record.
     */
    async first(): Promise<M[T] | undefined> {
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


export default class DbClient<M extends ModelTypeMap, I extends ModelIncludesMap<M>> {

    /**
     * Start a new query for the given model type.
     * @param modelType the camel_case name of the model
     */
    query<T extends keyof M & string>(modelType: T) {
        return new ModelQuery(modelType)
    }


    /**
     * Fetches a single record by id.
     * Throws an error if the record doesn't exist.
     * @param modelType the camel_case name of the model
     * @param id the id of the record
     * @param includes relations to include in the returned object
     */
    async find<T extends keyof M & string>(modelType: T, id: string, includes?: I[T]): Promise<M[T]> {
        const query = new ModelQuery(modelType).where("id = ?", id)
        if (includes) {
            query.includes(includes)
        }
        const record = await query.first()
        if (record) {
            return record as M[T]
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
    async findByIdOrSlug<T extends keyof M & string>(modelType: T, idOrSlug: string, includes?: I[T]): Promise<M[T]> {
        const column = isUuid(idOrSlug) ? "id" : "slug"
        const query = new ModelQuery(modelType).where(`${column} = ?`, idOrSlug)
        if (includes) {
            query.includes(includes)
        }
        const record = await query.first()
        if (record) {
            return record as M[T]
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
    async update<T extends keyof M & string>(modelType: T, record: M[T], includes: Includes<M,T,I> = {}): Promise<DbUpsertResponse<M,T> & ApiResponse> {
        const url = `/db/model/${modelType}/upsert.json`
        const body = {record, includes}
        log.debug(`Updating ${modelType} at ${url} with body`, body)
        return await Api.post<DbUpsertResponse<M,T>>(url, body)
    }

    /**
     * Update the given record and assume it will succeed.
     * This call should be wrapped in a try/catch.
     * @param modelType the camel_case name of the model
     * @param record the record to update
     * @param includes relations to include in the returned record
     */
    async safeUpdate<T extends keyof M & string>(modelType: T, record: M[T], includes: Includes<M,T,I> = {}): Promise<M[T]> {
        const res = await this.update(modelType, record, includes)
        if (res.status == 'success') {
            return res.record
        } else if (res.record) {
            throw new DbSaveException<M, T>(res.message, res.record as Unpersisted<M[T]>, res.errors)
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
    async insert<T extends keyof M & string>(modelType: T, record: Unpersisted<M[T]>, includes: Includes<M,T,I> = {}): Promise<DbUpsertResponse<M,T> & ApiResponse> {
        const url = `/db/model/${modelType}/upsert.json`
        const body = {record, includes}
        log.debug(`Inserting ${modelType} at ${url} with body`, body)
        return await Api.post<DbUpsertResponse<M,T>>(url, body)
    }

    /**
     * Inserts or updates a new record for the given model type,
     * depending on if it has an id.
     * @param modelType the camel_case name of the model
     * @param record the record to update
     * @param includes relations to include in the returned record
     */
    async upsert<T extends keyof M & string>(modelType: T, record: Unpersisted<M[T]>, includes: Includes<M,T,I> = {}) {
        const url = `/db/model/${modelType}/upsert.json`
        const body = {record, includes}
        log.debug(`Upserting ${modelType} at ${url} with body`, body)
        return await Api.post<DbUpsertResponse<M,T>>(url, body)
    }

    /**
     * Upserts the given record and assume it will succeed.
     * This call should be wrapped in a try/catch.
     * @param modelType the camel_case name of the model
     * @param record the record to update
     * @param includes relations to include in the returned record
     */
    async safeUpsert<T extends keyof M & string>(modelType: T, record: Unpersisted<M[T]>, includes: Includes<M,T,I> = {}) {
        const res = await this.upsert(modelType, record, includes)
        if (res.status == 'success') {
            return res.record
        } else if (res.record)  {
            throw new DbSaveException<M,T>(res.message, res.record as Unpersisted<M[T]>, res.errors)
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
type DbUpsertResponse<M extends ModelTypeMap, T extends keyof M & string> = SuccessfulDbUpsertResponse<M,T> | UnsuccessfulDbUpsertResponse<M,T>

type SuccessfulDbUpsertResponse<M extends ModelTypeMap, T extends keyof ModelTypeMap & string> = ApiResponse & {
    status: 'success'
    record: M[T]
}

type UnsuccessfulDbUpsertResponse<M extends ModelTypeMap, T extends keyof ModelTypeMap & string> = ApiResponse & {
    status: 'error'
    errors: DbErrors<M[T]>
    record?: M[T]
}


/**
 * The exception that gets raised when an insert or update call fails.
 */
export class DbSaveException<M extends ModelTypeMap, T extends keyof M> extends Error {
    record?: Unpersisted<M[T]>
    errors?: DbErrors<Unpersisted<M[T]>>

    constructor(message: string, record?: Unpersisted<M[T]>, errors?: DbErrors<Unpersisted<M[T]>>) {
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
export class ValidationException<M extends ModelTypeMap, T extends keyof M> extends DbSaveException<M,T> {
}
