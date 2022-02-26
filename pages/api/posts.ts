import { getPosts } from "models/MongoVoicePost"
import { NextApiRequest, NextApiResponse } from "next"

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    try {
        const { page } = req.query
        const pageNumber = parseInt(page[0]) || 0
        const posts = await getPosts(pageNumber)
        res.status(200).json({ success: true, data: posts })
    } catch (err) {
        console.log(err)
        res.status(500).json({ success: false, data: [] })
    }
}
