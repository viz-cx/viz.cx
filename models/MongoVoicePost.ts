import { getModelForClass, modelOptions, prop, DocumentType } from "@typegoose/typegoose"
import { VoicePost } from "./VoicePost"

@modelOptions({
    schemaOptions: { collection: 'posts' }
})
export class MongoVoicePost extends VoicePost {
    public static postsPerPage = 10

    public static postListCondition = {
        r: { $exists: false },
        "d.t": { $exists: true }
    }

    @prop({ required: true, index: true })
    block!: number
}

export const MongoVoicePostModel = getModelForClass(MongoVoicePost, {
    schemaOptions: { timestamps: false },
})

export async function getLastPageNumber(): Promise<number> {
    const count = await MongoVoicePostModel
        .countDocuments(MongoVoicePost.postListCondition)
    return Math.trunc(count / MongoVoicePost.postsPerPage) + 1
}

export async function getPostsCount(): Promise<number> {
    return await MongoVoicePostModel
        .countDocuments(MongoVoicePost.postListCondition)
}

export async function getPosts(page: number): Promise<DocumentType<MongoVoicePost>[]> {
    return await MongoVoicePostModel
        .find(MongoVoicePost.postListCondition)
        .sort({ _id: -1 })
        .skip(page > 0 ? ((page - 1) * MongoVoicePost.postsPerPage) : 0)
        .limit(MongoVoicePost.postsPerPage)
}

export async function getLastSavedPostsBlock(): Promise<number> {
    const count = await MongoVoicePostModel.countDocuments().exec()
    if (count === 0) {
        return 0
    }
    return (await MongoVoicePostModel.findOne().sort({ block: -1 }))!.block
}
