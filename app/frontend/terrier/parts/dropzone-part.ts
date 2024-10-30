import Messages from "tuff-core/messages"
import { PartTag } from "tuff-core/parts"
import TerrierPart from "./terrier-part"
import mime from "mime-types"

type DropzonePartState = {
    file_content?: string | ArrayBuffer
    dragging_over?: boolean
    accept_file_types: string[]
    text?: string
}

export const FileUploadedKey = Messages.typedKey<{ file: File, type: string }>()

export default class DropzonePart extends TerrierPart<DropzonePartState> {
    _dragOverKey = Messages.untypedKey()
    _dragLeaveKey = Messages.untypedKey()
    _dropKey = Messages.untypedKey()
    _fileInputChangedKey = Messages.untypedKey()

    async init() {
        this.state.dragging_over = false

        this.onDragOver(this._dragOverKey, m => {
            m.event.preventDefault()
            this.state.dragging_over = true
            this.stale()
        })

        this.onDragLeave(this._dragLeaveKey, () => {
            this.state.dragging_over = false
            this.stale()
        })

        this.onDrop(this._dropKey, m => {
            m.event.preventDefault()
            m.event.stopPropagation()
            this.state.dragging_over = false
            this.stale()

            if (m.event.dataTransfer) {
                if (m.event.dataTransfer.files.length != 1) {
                    this.alertToast("Please choose only one file to upload.")
                    return
                }
                const file = m.event.dataTransfer.files[0]
                this.handleFile(file)
            }
        })

        this.onChange(this._fileInputChangedKey, m => {
            const input = m.event.target as HTMLInputElement
            const file = input.files?.[0]
            if (file) this.handleFile(file)
        })
    }

    handleFile(file: File) {
        const type = mime.extension(file.type)
        if (type && !this.state.accept_file_types.includes(type)) {
            this.alertToast('Error uploading file: File must be one of the following types: ' + this.state.accept_file_types.map(type => `.${type}`).join('; '))
            return
        }

        this.emitMessage(FileUploadedKey, { file: file, type: type })
    };

    get parentClasses(): Array<string> {
        return super.parentClasses.concat('dropzone')
    }

    render(parent: PartTag) {
        parent.emitDragOver(this._dragOverKey)
        parent.emitDrop(this._dropKey)
        parent.emitDragLeave(this._dragLeaveKey)
        parent.input('#file-input', {
            type: 'file',
            accept: this.state.accept_file_types?.map(type => `.${type}`).join(',')
        }).css({ display: 'none' }).emitChange(this._fileInputChangedKey)
        const text = this.state.text || 'Choose File'
        parent.label('.file-input-button.glyp-plus', { text: text, htmlFor: 'file-input' })
    }

    update(elem: HTMLElement) {
        if (this.state.dragging_over) {
            elem.classList.add('dragging-over')
        } else {
            elem.classList.remove('dragging-over')
        }
    }
}