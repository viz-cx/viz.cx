<template>
    <div>
        <div v-if="posts.length === 0">
            No posts found.
        </div>
        <div v-else v-for="post in posts" :id="post.author + '/' + post.block">
            <SinglePost :post="post" />
            <br />
        </div>
        <v-btn v-show="showMoreButton" @click.prevent="loadMore()">Show next {{ page + 2 }}
            page</v-btn>
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
useAsyncData("fetch posts", async (): Promise<void> => {
    let url: string
    if (props.author) {
        url = `/posts/${props.tab}/${props.author}/${page.value}`
    } else {
        url = `/posts/${props.tab}/${page.value}`
    }
    const result: any = await $fetch(url, {
        baseURL: config.public.apiBaseUrl
    })
    if (result.length === 0) {
        showMoreButton.value = false
        return
    }
    posts.value = posts.value.concat(result)
    return
}, { watch: [page] })

function loadMore() {
    page.value += 1
}
</script>
