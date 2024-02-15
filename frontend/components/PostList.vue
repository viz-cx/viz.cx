<template>
    <div v-if="posts.length === 0">
        <div v-if="pending">
            <Spinner />
        </div>
        <div v-else>
            No posts found.
        </div>
    </div>
    <div v-else>
        <div v-if="pending">
            <PostsSkeleton />
        </div>
        <div v-if="!pending" v-for="post in posts" :id="post.author + '/' + post.block">
            <PostPreview :post="post" />
        </div>
        <div v-if="!pending">
            <button v-show="showMoreButton" @click.stop="loadMore()">Show next {{ page + 2 }}
                page</button>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps({
    tab: String,
    author: String
})

const page = ref(0)
const posts: any = ref([])
const showMoreButton = ref(true)

const config = useRuntimeConfig()
const { pending } = useAsyncData("fetch posts", async (): Promise<void> => {
    showMoreButton.value = false
    let url: string
    if (props.author) {
        url = `/posts/${props.tab}/${props.author}/${page.value}`
    } else {
        url = `/posts/${props.tab}/${page.value}`
    }
    const result: any = await $fetch(url, {
        baseURL: config.public.apiBaseUrl
    })
    showMoreButton.value = result.length === 10
    posts.value = posts.value.concat(result)
}, { watch: [page] })

function loadMore() {
    page.value += 1
}
</script>
