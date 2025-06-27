import { Simplify } from "../util-types"

/**
 * Base options for all tiny-modal alerts
 */
export type TinyModalAlertOptions = {
    title?: string
    body?: string
    icon?: string | string[]
    classes?: string | string[]
}

/**
 * Options for tinyModal.showAlert
 */
export type TinyModalShowAlertOptions = Simplify<TinyModalAlertOptions & { actions?: TinyModalAlertActionWithCallback[] }>

/**
 * Options for tinyModal.async.showAlert
 */
export type TinyModalAsyncShowAlertOptions = Simplify<TinyModalAlertOptions & { actions?: TinyModalAlertAction[] }>

/**
 * Options for tinyModal.confirmAlert and tinyModal.async.confirmAlert
 */
export type TinyModalConfirmAlertOptions = Simplify<TinyModalAlertOptions & {
    confirmTitle?: string
    confirmIcon?: string | string[]
    confirmClasses?: string | string[]
    cancelTitle?: string
    cancelIcon?: string | string[]
    cancelClasses?: string | string[]
}>

/**
 * Base type for an action in a tiny-modal alert
 */
export type TinyModalAlertAction = {
    name?: string
    title?: string
    icon?: string | string[]
    classes?: string | string[]
    href?: string
}

/**
 * Type for an action in a non-async tiny-modal alert
 */
export type TinyModalAlertActionWithCallback = Simplify<TinyModalAlertAction & { callback?: () => void }>

export type TinyModalGlobals = {
    close: () => void

    closeAlert: () => void
    showAlert: (options: TinyModalShowAlertOptions) => void
    confirmAlert: (title: string, body: string, callback: () => void, options?: TinyModalConfirmAlertOptions) => void
    noticeAlert: (title: string, body: string, action?: TinyModalAlertActionWithCallback, options?: TinyModalAlertOptions) => void
    alertAlert: (title: string, body: string, action?: TinyModalAlertActionWithCallback, options?: TinyModalAlertOptions) => void
    async: {
        showAlert: (options: TinyModalAsyncShowAlertOptions) => Promise<TinyModalAlertAction>
        confirmAlert: (title: string, body: string, options?: TinyModalConfirmAlertOptions) => Promise<boolean>
        noticeAlert: (title: string, body: string, action?: TinyModalAlertAction, options?: TinyModalAlertOptions) => Promise<void>
        alertAlert: (title: string, body: string, action?: TinyModalAlertAction, options?: TinyModalAlertOptions) => Promise<void>
    }
}