import { getPost } from "models/MongoVoicePost"
import { NextApiRequest, NextApiResponse } from "next"

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    try {
        const { id } = req.query
        const postId = id as string
        const post = await getPost(postId)
        res.status(200).json({ success: post !== null, post: post })
    } catch (err) {
        console.log(err)
        res.status(500).json({ success: false, post: null })
    }
}
