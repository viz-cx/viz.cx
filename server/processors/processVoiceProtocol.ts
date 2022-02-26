import { BlockchainCustom } from 'models/BlockchainCustom'
import { getLastSavedPostsBlock, MongoVoicePost, MongoVoicePostModel } from '../../models/MongoVoicePost'
import { OpInBlockModel } from '../../models/OpInBlock'

export async function processVoiceProtocol() {
    try {
        const lastSavedBlock = await getLastSavedPostsBlock()
        const newPosts = await OpInBlockModel
            .find({
                "type": "custom",
                "obj.id": "V",
                "block": { $gt: lastSavedBlock }
            })
            .limit(10)
        const mongoPosts = newPosts.flatMap(post => {
            const customObject = post.obj as BlockchainCustom
            const voicePost = JSON.parse(customObject.json) as MongoVoicePost
            voicePost.block = post.block
            return voicePost
        })
        if (mongoPosts.length > 0) {
            console.log(mongoPosts)
        }
        await MongoVoicePostModel.insertMany(mongoPosts)
    } catch (e) {
        console.log(e)
    }
}
