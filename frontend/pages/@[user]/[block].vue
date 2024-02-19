<template>
    <Head>
        <Title>{{ post ? post.author + ': ' + titleFromText(post.d.t) : noPostTitle }}</Title>
        <Link v-if="post" rel="canonical" :href="'https://viz.cx/@' + post.author + '/' + post.block" />
    </Head>
    <div v-if="pending">
        <Spinner />
    </div>
    <div v-else-if="post" :id="post.author + '/' + post.block">
        <SinglePost :post="post" />
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
</script>
