import { markdown_clear_code, markdown_decode_text } from 'helpers/markdown'
import { MongoVoicePostModel } from 'models/MongoVoicePost'
import { VoicePostType } from 'models/VoicePost'
import { useRouter } from 'next/router'

import { startMongo } from '../../helpers/startMongo'
import styles from '../../styles/Home.module.css'

function Post({ post }: any) {
    const router = useRouter()
    if (router.isFallback) {
        return <div>Loading...</div>
    }
    let nsfw_text = ''
    let title = ''
    switch (post.t) {
        case VoicePostType.Text:
            if (typeof post.d.text !== 'undefined') {
                nsfw_text = post.d.text
            } else {
                if (typeof post.d.t !== 'undefined') {
                    nsfw_text = post.d.t
                }
            }
            break
        case VoicePostType.Publication:
            let strikethrough_pattern = /\~\~(.*?)\~\~/gm
            title = markdown_decode_text(post.d.t.replace(strikethrough_pattern, '<strike>$1</strike>'))
            nsfw_text = markdown_clear_code(post.d.m) //markdown
            nsfw_text = markdown_decode_text(nsfw_text)
            let mnemonics_pattern = /&#[a-z0-9\-\.]+;/g
            nsfw_text = nsfw_text.replace(mnemonics_pattern, '') //remove unexpected html mnemonics
            break
    }
    return (<div className={styles.container}>
        <h1>{title}</h1>
        {/* <div>Author: {post.author}</div> */}
        <div className={styles.posts}>{nsfw_text}</div>
    </div>)
}

export async function getStaticPaths() {
    await startMongo()
    let posts = await MongoVoicePostModel.find({})
    const paths = posts.map((post) => {
        return {
            params: { id: post.slug }
        }
    })
    return {
        fallback: true,
        paths: paths
    }
}

export async function getStaticProps({ params }: any) {
    await startMongo()
    const post = await MongoVoicePostModel.findOne({ slug: params.id })
    if (!post) {
        return {
            notFound: true
        }
    }
    return {
        props: {
            post: {
                title: post.title,
                author: post.author,
                t: post.t || VoicePostType.Text,
                d: post.d
            }
        },
        // revalidate: 10
    }
}

export default Post
