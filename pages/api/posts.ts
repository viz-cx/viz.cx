import { getLastPageNumber, getPosts, getPostsCount, MongoVoicePost } from "models/MongoVoicePost"
import { NextApiRequest, NextApiResponse } from "next"

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    try {
        const { page } = req.query
        let pageNumber = parseInt(page[0]) || 1
        if (pageNumber < 1) {
            pageNumber = 1
        }
        const lastPageNumber = await getLastPageNumber()
        const posts = await getPosts(pageNumber)
        const totalCount = await getPostsCount()
        const meta = {
            totalCount: totalCount,
            pageCount: lastPageNumber,
            currentPage: pageNumber,
            perPage: MongoVoicePost.postsPerPage
        }
        res.status(200).json({ success: true, posts: posts, meta: meta})
    } catch (err) {
        console.log(err)
        res.status(500).json({ success: false, posts: [], meta: {} })
    }
}
