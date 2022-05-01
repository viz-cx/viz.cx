import { BlockchainCustom } from 'models/BlockchainCustom'
import { getLastSavedPostsBlock, MongoVoicePost, MongoVoicePostModel } from '../../models/MongoVoicePost'
import { OpInBlockModel } from '../../models/OpInBlock'
var slugify = require('slugify')

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
            let json = JSON.parse(customObject.json)
            let voicePost = json as MongoVoicePost
            voicePost.block = post.block
            voicePost.author = customObject.required_regular_auths[0]
            voicePost.title = makeTitle(voicePost.d.t, voicePost.block)
            voicePost.slug = slugify(`${voicePost.title} ${voicePost.block}`, {
                replacement: '-',
                remove: undefined,
                lower: true,
                strict: true,
                trim: true,
                // locale: 'ru'
            })
            return voicePost
        })
        if (mongoPosts.length > 0) {
            console.log(mongoPosts)
            await MongoVoicePostModel.insertMany(mongoPosts)
        }
    } catch (e) {
        console.log(e)
    }
}

function makeTitle(input: string, block: number) {
    let string = input.trim()
    if (string.length === 0) {
        return `#${block}`
    }
    if (string.length > 100) {
        return string.substring(0, 100) + '...'
    }
    return string
}
