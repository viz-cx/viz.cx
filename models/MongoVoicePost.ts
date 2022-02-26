import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose"
import { VoicePost } from "./VoicePost"

@modelOptions({
    schemaOptions: { collection: 'posts' }
})
export class MongoVoicePost extends VoicePost {
    @prop({ required: true, index: true })
    block!: number
}

export const MongoVoicePostModel = getModelForClass(MongoVoicePost, {
    schemaOptions: { timestamps: false },
})

export async function getPosts(page: number) {
    const perPage = 10
    return await MongoVoicePostModel
        .find({
            r: { $exists: false }
        })
        .sort({ _id: -1 })
        .skip(page > 0 ? ((page - 1) * perPage) : 0)
        .limit(perPage)
}

export async function getLastSavedPostsBlock(): Promise<number> {
    const count = await MongoVoicePostModel.countDocuments().exec()
    if (count === 0) {
        return 0
    }
    return (await MongoVoicePostModel.findOne().sort({ block: -1 }))!.block
}
