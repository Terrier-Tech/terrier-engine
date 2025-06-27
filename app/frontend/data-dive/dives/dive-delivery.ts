import { PartTag } from "tuff-core/parts"
import { DiveEditorState } from "./dive-editor"
import TerrierPart from "../../terrier/parts/terrier-part"
import Schedules, { RegularScheduleFields } from "../../terrier/schedules"
import { Logger } from "tuff-core/logging"
import { EmailListForm } from "../../terrier/emails"
import {
    DdDive,
    DdDiveDistribution,
    DdDiveRun,
    UnpersistedDdDiveDistribution
} from "../gen/models";
import Db from "../dd-db"
import dayjs from "dayjs"
import Dates from "../queries/dates"
import DiveRuns from "./dive-runs"
import { ModalPart } from "../../terrier/modals"
import { TerrierFormFields } from "../../terrier/forms"
import Messages from "tuff-core/messages"
import Fragments from "../../terrier/fragments"

const log = new Logger("Dive Delivery")


////////////////////////////////////////////////////////////////////////////////
// Delivery Form
////////////////////////////////////////////////////////////////////////////////

export class DiveDeliveryPanel extends TerrierPart<DiveEditorState> {

    distributions!: DdDiveDistribution[]
    deliveryList!: DiveDeliveryList

    newKey = Messages.untypedKey()
    editKey = Messages.typedKey<{id: string}>()
    static reloadKey = Messages.untypedKey()

    async init() {
        this.deliveryList = this.makePart(DiveDeliveryList, this.state)

        this.listenMessage(DiveDeliveryPanel.reloadKey, _ => {
            log.info("Reloading dive delivery panel")
            this.reload()
        }, {attach: 'passive'})

        this.onClick(this.newKey, _ => {
            const dist: UnpersistedDdDiveDistribution = {
                dd_dive_id: this.state.dive.id,
                recipients: [],
                schedule: {
                    schedule_type: 'daily',
                    hour_of_day: "0"
                }
            }
            this.app.showModal(DiveDistributionModal, { ...this.state, distribution: dist })
        })

        this.onClick(this.editKey, m => {
            const id = m.data.id
            log.info(`Editing distribution ${id}`)
            const dist = this.distributions.filter(d => d.id == id)[0]
            if (dist) {
                this.app.showModal(DiveDistributionModal, { ...this.state, distribution: dist })
            }
            else {
                log.warn(`Could not find distribution ${id}`)
            }
        })

        await this.reload()
    }

    async reload() {
        this.distributions = await getDistributions(this.state.dive)
        this.dirty()
    }

    get parentClasses(): Array<string> {
        return ['tt-flex', 'column', 'gap', 'dd-dive-tool', 'tt-typography']
    }

    render(parent: PartTag): any {
        // distributions
        parent.h3(".glyp-setup").text("Distributions")
        parent.div('.distributions.tt-flex.column.gap', distContainer => {
            for (const dist of this.distributions) {
                this.renderDistribution(distContainer, dist)
            }
        })
        Fragments.button(parent, this.theme, "New", "glyp-plus_outline")
            .class('secondary')
            .emitClick(this.newKey)

        // deliveries
        parent.div('.deliveries', deliveriesContainer => {
            // it looks better without the gap between the header and list
            deliveriesContainer.h3(".glyp-inbox").text("Deliveries")
            deliveriesContainer.part(this.deliveryList)
        })
    }

    renderDistribution(parent: PartTag, dist: DdDiveDistribution) {
        parent.a('.distribution', view => {
            // schedule
            view.div(".schedule", scheduleView => {
                const scheduleDesc = Schedules.describeRegular(dist.schedule)
                scheduleView.text(scheduleDesc)
            })

            // recipients
            view.div(".recipients", recipientsList => {
                if (dist.recipients?.length) {
                    dist.recipients.forEach((recipient) => {
                        recipientsList.div(".recipient.glyp-users.with-icon").text(recipient)
                    })
                } else {
                    // no recipients
                    recipientsList.div().text("No Recipients")
                }
            })
        }).emitClick(this.editKey, {id: dist.id})
    }

}


////////////////////////////////////////////////////////////////////////////////
// Delivery List
////////////////////////////////////////////////////////////////////////////////

class DiveDeliveryList extends TerrierPart<DiveEditorState> {

    runs: DdDiveRun[] = []

    async init() {
        this.runs = await Db().query("dd_dive_run")
            .where({dd_dive_id: this.state.dive.id})
            .where("delivery_recipients is not null")
            .orderBy("created_at desc")
            .limit(100)
            .exec()

        this.dirty()
    }

    get parentClasses(): Array<string> {
        return ['dive-delivery-list']
    }

    render(parent: PartTag) {
        for (const run of this.runs) {
            parent.div(".run", view => {
                view.div(".recipients", recipientsList => {
                    if (run.delivery_recipients?.length) {
                        run.delivery_recipients.forEach((recipient) => {
                            recipientsList.div(".recipient.glyp-users.with-icon").text(recipient)
                        })
                    }
                    else {
                        // no recipients
                        recipientsList.div().text("No Recipients")
                    }
                })
                view.div('.datetime', dateTimeView => {
                    const d = dayjs(run.created_at)
                    dateTimeView.div(".date").text(d.format(Dates.displayFormat))
                    dateTimeView.div(".time").text(d.format("H:mm A"))
                })
                run.dd_dive = this.state.dive // so that the filename is better
                view.a(".download.glyp-download", {href: DiveRuns.outputUrl(run), target: '_blank'})
                    .data({tooltip: "Download the dive results for this delivery"})
            })
        }
    }

}


////////////////////////////////////////////////////////////////////////////////
// Distribution Persistence
////////////////////////////////////////////////////////////////////////////////


/**
 * Get all distributions for the given dive.
 * @param dive
 */
async function getDistributions(dive: DdDive): Promise<DdDiveDistribution[]> {
    return await Db().query('dd_dive_distribution')
        .where({ dd_dive_id: dive.id, _state: 0 })
        .orderBy("created_at ASC")
        .exec()
}

/**
 * Soft delete a distribution.
 * @param dist
 */
async function softDeleteDistribution(dist: DdDiveDistribution) {
    dist._state = 2
    return await Db().update('dd_dive_distribution', dist)
}


////////////////////////////////////////////////////////////////////////////////
// Distribution Modal
////////////////////////////////////////////////////////////////////////////////

export type DiveDistributionEditorState = {
    dive: DdDive
    distribution: UnpersistedDdDiveDistribution

}

class DiveDistributionModal extends ModalPart<DiveDistributionEditorState> {

    fields!: TerrierFormFields<UnpersistedDdDiveDistribution>
    dist!: UnpersistedDdDiveDistribution

    scheduleFields!: RegularScheduleFields
    recipientsForm!: EmailListForm

    saveKey = Messages.untypedKey()
    deleteKey = Messages.untypedKey()

    async init() {
        this.dist = this.state.distribution

        this.setIcon('glyp-email')

        this.scheduleFields = new RegularScheduleFields(this, this.dist.schedule, {
            showNoneOption: false,
            optionTitle: (type, title) =>
                `${type == 'monthanchored' ? "Deliver on" : "Deliver"} ${title}`
        })
        this.recipientsForm = this.makePart(EmailListForm, { emails: this.dist.recipients || [] })

        // save
        this.addAction({
            title: "Save",
            icon: "glyp-checkmark",
            click: { key: this.saveKey }
        })
        this.onClick(this.saveKey, _ => {
            log.debug("Saving distribution", this.dist)
            this.save()
        })

        // delete
        if (this.dist.id?.length) {
            this.setTitle("Edit Distribution")
            this.addAction({
                title: "Delete",
                icon: "glyp-delete",
                classes: ['alert'],
                click: { key: this.deleteKey }
            }, 'secondary')
        }
        else {
            this.setTitle("New Distribution")
        }
        this.onClick(this.deleteKey, async _ => {
            if (confirm("Are you sure you want to delete this distribution?")) {
                log.info("Deleting distribution", this.dist)
                await softDeleteDistribution(this.dist as DdDiveDistribution)
                this.emitMessage(DiveDeliveryPanel.reloadKey, {})
                this.successToast("Successfully Deleted Distribution")
                this.pop()
            }
        })
    }

    get contentClasses() {
        return ['padded', ...super.contentClasses]
    }

    renderContent(parent: PartTag): void {
        parent.div(".tt-grid.large-gap", row => {
            row.div('.stretch.tt-flex.column.gap', col => {
                col.h3(".glyp-setup.text-center").text("Schedule")
                this.scheduleFields.render(col)
            })
            row.div('.stretch.tt-flex.column.gap', col => {
                col.h3(".glyp-users.text-center").text("Recipients")
                col.part(this.recipientsForm)
            })
        })
    }

    async save() {
        this.dist.recipients = this.recipientsForm.state.emails
        if (!this.dist.recipients?.length) {
            this.alertToast("You must set at least one recipient")
            return
        }

        this.dist.schedule = await this.scheduleFields.serializeConcrete()

        log.info("Saving distribution", this.dist)

        const res = await Db().upsert('dd_dive_distribution', this.dist)
        if (res.status == 'success') {
            this.state.distribution = res.record
            this.emitMessage(DiveDeliveryPanel.reloadKey, {})
            this.successToast("Successfully Saved Distribution")
            return this.pop()
        }

        // errors
        log.warn("Error saving distribution", res)
        this.alertToast(res.message)

    }

}

