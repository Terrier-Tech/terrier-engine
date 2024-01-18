import TerrierPart from "./parts/terrier-part"
import {NoState, PartTag} from "tuff-core/parts"

////////////////////////////////////////////////////////////////////////////////
// Types
////////////////////////////////////////////////////////////////////////////////

export type LogLevel = 'success' | 'info' | 'warn' | 'error' | 'debug'

/**
 * Type of log events from a streaming response.
 */
export type LogEntry = {
    level: LogLevel
    prefix?: string
    message: string
}


////////////////////////////////////////////////////////////////////////////////
// List Part
////////////////////////////////////////////////////////////////////////////////

export class LogListPart extends TerrierPart<NoState> {

    entries: LogEntry[] = []

    async init() {
    }

    render(parent: PartTag): any {
        parent.div('.tt-log-entries', entries => {
            for (const entry of this.entries) {
                this.renderEntry(entries, entry)
            }
        })
    }

    /**
     * Pushes an entry to the list and renders it.
     * @todo make this more performant for large lists!
     * @param entry
     */
    push(entry: LogEntry) {
        this.entries.push(entry)
        this.dirty()
    }

    /**
     * Clears the list.
     */
    clear() {
        this.entries = []
        this.dirty()
    }

    success(message: string, prefix: string | undefined) {
        this.push({message, prefix, level: "success"})
    }

    info(message: string, prefix?: string) {
        this.push({message, prefix, level: "info"})
    }

    warn(message: string, prefix?: string) {
        this.push({message, prefix, level: "warn"})
    }

    error(message: string, prefix?: string) {
        this.push({message, prefix, level: "error"})
    }

    debug(message: string, prefix?: string) {
        this.push({message, prefix, level: "debug"})
    }

    renderEntry(parent: PartTag, entry: LogEntry) {
        parent.div(`.log-entry.${entry.level}`, row => {
            row.div('.message').text(entry.message)
        })
    }

}