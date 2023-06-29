import {ModalPart} from "../../terrier/modals"
import {PartTag} from "tuff-core/parts"
import {DdDive, DdDiveRun, UnpersistedDdDiveRun} from "../gen/models"
import Db from "../dd-db"
import Api, {ErrorEvent} from "../../terrier/api"
import {Query} from "../queries/queries"
import {DivTag} from "tuff-core/html"
import {messages} from "tuff-core"

type RunQueryResult = {
    id: string
    time: string
    status: 'pending' | 'success' | 'alert'
    message?: string
}

export class DiveRunModal extends ModalPart<{dive: DdDive }> {

    run?: DdDiveRun
    error?: ErrorEvent
    queryResults: Record<string, RunQueryResult> = {}

    startKey = messages.untypedKey()

    async init() {
        this.setTitle("Run Dive")
        this.setIcon('glyp-play')

        this.addAction({
            title: "Run",
            icon: 'glyp-play',
            click: {key: this.startKey}
        })

        this.onClick(this.startKey, _ => {
            this.createRun()
        })
    }

    async createRun() {
        const newRun: UnpersistedDdDiveRun = {
            dd_dive_id: this.state.dive.id,
            status: 'initial'
        }
        const res = await Db().upsert('dd_dive_run', newRun)
        if (res.status == 'success' && res.record) {
            this.beginStreaming(res.record)
        } else {
            this.alertToast(`Error creating dive run: ${res.message}`)
        }
        this.dirty()
    }

    beginStreaming(run: DdDiveRun) {
        this.run = run
        Api.stream(`/data_dive/stream_run/${this.run.id}`)
            .on<RunQueryResult>('query_result', res => {
                this.queryResults[res.id] = res
                this.dirty()
            })
            .onError(evt => {
                this.error = evt
                this.dirty()
            })
    }

    renderContent(parent: PartTag): void {
        parent.div('.tt-flex.column.gap.padded.dd-dive-run-status', col => {
            if (this.error) {
                col.div('.tt-bubble.alert').text(this.error.message)
                return
            }

            if (!this.run) {
                col.h3('.text-center', h3 => {
                    h3.i('.glyp-pending')
                    h3.span().text("Ready to Run!")
                })
                return
            }

            for (const query of this.state.dive.query_data?.queries || []) {
                this.renderQuery(col, query)
            }
        })
    }

    renderQuery(parent: DivTag, query: Query) {
        const res = this.queryResults[query.id]
        const status = res?.status || 'pending'

        parent.div('.run', status, row => {
            row.i(`.glyp-${status}`)
            row.div().text(query.name)
            if (res?.status == 'alert') {
                row.div('.tt-bubble.alert').text(res.message || "Error!")
            }
            else if (res?.message?.length) {
                row.div('.details').text(res.message)
            }
        })
    }

}