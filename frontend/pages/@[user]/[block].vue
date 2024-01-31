<template>
    <Head>
        <Title>{{ post ? post.author + ': ' + titleFromText(post.d.t) : noPostTitle }}</Title>
        <Link v-if="post" rel="canonical" :href="'https://viz.cx/@' + post.author + '/' + post.block" />
    </Head>
    <div v-if="pending">
        <Spinner />
    </div>
    <div v-else-if="post" :id="post.author + '/' + post.block">
        <SinglePost :post="post" :always-opened="true" />

        <div v-if="pendingComments">
            <PostsSkeleton />
        </div>
        <div v-else id="comments">
            <h3 class="mt-4">
                <v-icon icon="mdi-message-text-outline" />
                <span class="ml-1">Comments</span>
            </h3>
            <CommentEditor />
            <div v-for="comment in newComments.concat(comments)">
                <br />
                <Comment @change-active-reply="updateActiveReply" :comment="comment" :fake="comment.isFake"
                    :active-reply="activeReply" />
            </div>
            <br />
        </div>
    </div>
    <div v-else>
        <h1>{{ noPostTitle }}</h1>
    </div>
</template>

<script setup lang="ts">
const noPostTitle = 'Post not found'
const config = useRuntimeConfig()
const route = useRoute()
const { pending, data: post } = useAsyncData("find post",
    async () => $fetch(`/posts/@${route.params.user}/${route.params.block}`, {
        baseURL: config.public.apiBaseUrl
    }),
    {
        transform: (data: any) => {
            data.show = true
            return data
        },
    }
)

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
    if (post.value) {
        post.value.comments += 1
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
