<template>
    <div>

        <Head>
            <Title>{{ titleFromText(post.d.t) }}</Title>
        </Head>
        <div v-if="pending">
            <Spinner />
        </div>
        <div v-else>
            <v-card text="..." variant="outlined">{{ post.d.t }}</v-card>
        </div>
    </div>
</template>

<script setup lang="ts">

const config = useRuntimeConfig()
const route = useRoute()
const { pending, data: post } = useAsyncData("find post",
    async () => $fetch(`/posts/${route.params.id}`, {
        baseURL: config.public.apiBaseUrl
    }),
    {
        transform: (data: any) => {
            return data
        },
    }
)
</script>
