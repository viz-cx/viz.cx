<template>
    <div>

        <Head>
            <Title>{{ post.author + ': ' + titleFromText(post.d.t) }}</Title>
        </Head>
        <div v-if="pending">
            <Spinner />
        </div>
        <div v-else>
            <SinglePost :post="post" :always-opened="true" />
        </div>
    </div>
</template>

<script setup lang="ts">

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
