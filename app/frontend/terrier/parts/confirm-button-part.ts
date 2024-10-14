import {PartTag} from "tuff-core/parts"
import Messages, {TypedKey} from "tuff-core/messages"
import { ColorName, IconName } from "../theme"
import TerrierPart from "./terrier-part"

export type ConfirmButtonStatusDef = { icon: IconName, iconColor: ColorName, tooltip: string }
export type ConfirmButtonStatus = 'initial' | 'awaiting_confirmation' | 'confirmed'
export type StatusDefs = Record<ConfirmButtonStatus, ConfirmButtonStatusDef>

export type ConfirmButtonState<TData> = { statusDefs: StatusDefs, onConfirmKey: TypedKey<TData>, confirmData: TData, onSelectKey: TypedKey<TData> | undefined}

/**
 * A button that requires the user to click twice to confirm an action
 */
export default class ConfirmButton<TData> extends TerrierPart<ConfirmButtonState<TData>> {
    status: ConfirmButtonStatus = 'initial'

    private readonly statusKeys = {
        initial: Messages.untypedKey(),
        awaiting_confirmation: Messages.untypedKey(),
        confirmed: undefined,
    } as const

    async init() {
        this.onClick(this.statusKeys.initial, _ => {
            this.status = 'awaiting_confirmation'
            this.dirty()
            if (this.state.onSelectKey) {
                this.emitMessage(this.state.onSelectKey, this.state.confirmData)
            }
        })
        this.onClick(this.statusKeys.awaiting_confirmation, async _ => {
            this.status = 'confirmed'
            this.dirty()
            this.emitMessage(this.state.onConfirmKey, this.state.confirmData)
        })
    }

    get parentClasses(): Array<string> {
        return ['confirm-button', ...super.parentClasses]
    }

    render(parent: PartTag) {
        const {
            icon,
            iconColor,
            tooltip
        } = this.state.statusDefs[this.status]

        const link = parent.a({data: {tooltip}}, a => {
            this.theme.renderIcon(a, icon, iconColor)
        })

        const clickKey = this.statusKeys[this.status]
        if (clickKey) link.emitClick(clickKey)
    }

}