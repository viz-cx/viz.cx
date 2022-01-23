import { getModelForClass, modelOptions, prop, Severity } from "@typegoose/typegoose"

@modelOptions({
    schemaOptions: { collection: 'blocks' },
    options: {
        allowMixed: Severity.ALLOW
    }
})
export class OpInBlock {
    @prop({ required: true, index: true })
    block!: number

    @prop({ required: true })
    timestamp!: Date

    @prop({ required: false })
    trx_id?: string

    @prop({ required: true, index: true })
    type!: string

    @prop({ required: true })
    obj!: Object
}

export const OpInBlockModel = getModelForClass(OpInBlock, {
    schemaOptions: { timestamps: false },
})

export async function getLastSavedBlock(): Promise<number> {
    const count = await OpInBlockModel.countDocuments().exec()
    if (count === 0) {
        return 0
    }
    return (await OpInBlockModel.findOne().sort({ block: -1 }))!.block
}
