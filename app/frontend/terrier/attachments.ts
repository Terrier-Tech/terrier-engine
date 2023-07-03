import {Logger} from "tuff-core/logging"

const log = new Logger('Attachments')

type MetaData = {
    size: number
    filename: string
    mime_type: string
}

type ShrineAttachment = {
    id: string
    storage: string
    metadata: MetaData
    path?: string // used to send tmp filepath to server
}

type Derivatives = {
    thumbnail?: ShrineAttachment
}

export type Attachment = ShrineAttachment & { derivatives?: Derivatives }

/**
 * Constructs a url pointing to the original or a derivative of the attachment
 * @param attachment
 * @param derivative
 */
function url(attachment: Attachment, derivative: keyof Derivatives | null) {
    let path = '/uploads'
    let id

    if (derivative?.length && attachment.derivatives) {
        const derivativeId = attachment.derivatives[derivative]?.id
        if (derivativeId?.length) {
            path += '/permanent'
            id = derivativeId
        } else {
            log.info(`${derivative} not found, returning original`)
        }
    }

    if (!id) {
        path += '/cache'
        id = attachment.id
    }

    return `${path}/${id}`
}

const Attachments = {
    url
}

export default Attachments