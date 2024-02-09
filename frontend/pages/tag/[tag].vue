<template>
    <Head>
        <Title>Posts by tag #{{ route.params.tag }}</Title>
    </Head>
    <div v-if="pending">
        <Spinner />
    </div>
    <div v-else-if="error">
        <h3>{{ error }}</h3>
    </div>
    <div v-else>
        <div v-for="post in posts" :id="post.author + '/' + post.block">
            <SinglePost :post="post" />
            <br />
        </div>
    </div>
</template>

<script setup lang="ts">
const route = useRoute()
const config = useRuntimeConfig()
const { error, pending, data: posts } = useAsyncData("find posts by tag",
    async () => $fetch(`/posts/tags/${route.params.tag}`, {
        baseURL: config.public.apiBaseUrl
    }),
    {
        transform: (data: any) => {
            return data
        },
    }
)
</script>
