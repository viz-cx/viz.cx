<template>
    <article v-if="props.post">
        <header>
            <img align="left" class="u-square small"
                :src="`${config.public.apiBaseUrl}/profile/avatar/${props.post?.author}`" />
            <p>
                <nuxt-link :href="'/@' + props.post.author">@{{ props.post.author }}</nuxt-link>&nbsp;&nbsp;&nbsp;

                <span :title="props.post.timestamp + 'Z'">{{ timeAgo(props.post.timestamp + 'Z') }}</span>

                <span class="navright">
                    {{ 'there will be buttons' }}
                </span>
            </p>
        </header>
        <section>
            <Content :post="props.post" :opened="true" />
        </section>
        <footer>
            <nav>
                <RateButtons :author="props.post.author" :memo="'viz://@' + props.post.author + '/' + props.post.block"
                    :awards="props.post.awards" :shares="props.post.shares" />
                <ShareButtons :link="link" />
            </nav>
        </footer>
        <hr />
    </article>

    <section>
        <div v-if="pendingComments">
            <PostsSkeleton />
        </div>
        <div v-else id="comments">
            <CommentEditor @success="newComment" :isReply="false" :reply="toVoiceLink(post)" />
            <Comment v-for="comment in newComments.concat(comments)" @change-active-reply="updateActiveReply"
                :comment="comment" :fake="comment.isFake" :active-reply="activeReply" />
        </div>
    </section>
</template>

<script setup lang="ts">
import RelativeTime from '@yaireo/relative-time'
import Popper from "vue3-popper"

defineComponent({
    components: {
        Popper,
    },
})

const route = useRoute()
const link = 'https://viz.cx' + route.fullPath

const props = defineProps({
    post: Object,
    fakePost: Boolean
})

function isUserAuthor(author: string): boolean {
    return author === useCookie('login').value
}

const relativeTime = new RelativeTime({ locale: 'en' })
function timeAgo(date: string): string {
    return relativeTime.from(new Date(date))
}

const config = useRuntimeConfig()
const { pending: pendingComments, data: comments } = useAsyncData("find comments",
    async () => $fetch(`/posts/comments/@${route.params.user}/${route.params.block}`, {
        baseURL: config.public.apiBaseUrl
    }),
    {
        transform: (data: any) => {
            return data
        },
    }
)

const activeReply = ref('')
function updateActiveReply(commentId: string) {
    if (activeReply.value !== commentId) {
        activeReply.value = commentId
    }
}

const newComments: Ref<any[]> = ref([])
function newComment(content: any) {
    if (props.post && props.post.value) {
        props.post.value.comments += 1
    }
    const timestamp = new Date().toISOString().slice(0, -1) // "2024-01-18T16:05:27"
    const comment: any = {
        "block": 0,
        "author": useCookie('login').value ?? "",
        "d": {
            't': content,
        },
        "shares": 0,
        "timestamp": timestamp,
        "isFake": true
    }
    newComments.value.unshift(comment)
}
</script>
