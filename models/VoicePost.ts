import { modelOptions, prop, Severity } from "@typegoose/typegoose"
import { Benificiary } from "./Benificiary"

export enum VoicePostType {
    Publication = "p",
    Text = "t",
}

@modelOptions({
    options: {
        allowMixed: Severity.ALLOW
    }
})
export class VoicePost {
    @prop({ required: true })
    p!: number // previous block for linking

    @prop({ required: true })
    d!: VoicePublicationData | VoiceTextData // data

    @prop({ required: false })
    t?: VoicePostType // type ("t" or "p" for now; default "t")

    @prop({ required: false })
    v?: number // version (increase if back compatibility is broken)
}

// Extended text with voice markdown markup
export class VoicePublicationData {
    @prop({ required: true })
    t!: string // title

    @prop({ required: true })
    m!: string // markdown body

    @prop({ required: false })
    d?: string // description for preview

    @prop({ required: false })
    i?: string // image for preview thumbnail

    @prop({ required: false })
    r?: string // link to replied context in viz:// url scheme

    @prop({ required: false })
    s?: string // share link to shared context in any url scheme

    @prop({ required: false })
    b?: [Benificiary] // beneficiaries
}

// Simple short text note without markup
export class VoiceTextData {
    @prop({ required: false })
    t!: string // simple text note
    
    @prop({ required: false })
    text!: string // for backward compatibility

    @prop({ required: false })
    r?: string // link to replied context in viz:// url scheme

    @prop({ required: false })
    s?: string // share link to shared context in any url scheme

    @prop({ required: false })
    b?: [Benificiary] // beneficiaries
}
