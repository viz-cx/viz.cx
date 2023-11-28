<template>
    <div>

        <Head>
            <Title>{{ title }}</Title>
        </Head>
        <h1>{{ title }}</h1>
        <div v-if="pending">
            <Spinner />
        </div>
        <div v-else>
            <div v-for="item in posts">
                <div>
                    <nuxt-link :href="item" target="_blank">{{ item.d.t }}</nuxt-link>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const title = 'Posts list'

const config = useRuntimeConfig()
const { pending, data: posts } = useAsyncData("/posts",
    async () => $fetch("/posts", {
        baseURL: config.public.apiBaseUrl
    })
)
</script>
