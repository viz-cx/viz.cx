<template>
    <div>

        <Head>
            <Title>{{ title }}</Title>
        </Head>
        <div v-if="pending">
            <Spinner />
        </div>
        <div v-else class="posts">
            <div v-for="post in posts" :key="post.block">
                <v-card variant="outlined" hover>
                    <v-card-subtitle @click.stop="post.show = !post.show; spotlightPost = post">
                        <nuxt-link :href="'/@' + post.author">@{{ post.author }}</nuxt-link>
                        posted {{ !(post.d.i || post.d.s) ? 'text' : '' }}
                        <nuxt-link v-show="post.d.s" :href="post.d.s" target="_blank">link</nuxt-link>
                        {{ post.d.i ? (post.d.s ? ' and ' : '') + 'image' : '' }}
                        {{ timeAgo(post.timestamp) }}:
                    </v-card-subtitle>
                    <v-card-text @click.stop="post.show = true; spotlightPost = post">
                        {{ post.show ? fullPost(post) : truncatedText(post.d.t) }}
                    </v-card-text>
                    <v-img v-show="post.show" aspect-ratio="16/9" cover :src="post.d.i">
                        <template v-slot:placeholder>
                            <div class="d-flex align-center justify-center fill-height">
                                <v-progress-circular color="grey-lighten-4" indeterminate></v-progress-circular>
                            </div>
                        </template>
                    </v-img>
                    <v-card-actions v-show="post.show">
                        <v-btn icon="$plus"></v-btn>
                        {{ post.shares !== undefined ? post.shares.toFixed(3) : '???' }} VIZ
                        <v-btn icon="$minus"></v-btn>
                        <v-spacer></v-spacer>
                        <v-btn icon="$edit"></v-btn>
                        <v-btn icon="$delete"></v-btn>

                    </v-card-actions>
                </v-card>
                <!-- <nuxt-link :href="'/posts/' + post.block" target="_blank">{{ titleFromText(post.d.t ?? post.d.text ?? "no title") }}</nuxt-link> -->
                <br />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import RelativeTime from '@yaireo/relative-time'
const relativeTime = new RelativeTime({ locale: 'en' })

const title = 'Posts'

const config = useRuntimeConfig()
const { pending, data: posts } = useAsyncData("/posts/",
    async () => $fetch("/posts/", {
        baseURL: config.public.apiBaseUrl
    }),
    {
        transform: (data: any) => {
            return data
        },
    }
)

function fullPost(post: any) {
    let result = post.d.t
    return result
}

function truncatedText(text: string): string {
    let newText = text.substring(0, 280)
    if (text.length === newText.length) {
        return newText
    }
    return newText + '...'
}

function timeAgo(date: string): string {
    return relativeTime.from(new Date(date))
}

let spotlightPost = ref()
useAsyncData("fetch metadata",
    async (): Promise<any> => {
        let result = await $fetch("voice/post", {
            baseURL: config.public.apiBaseUrl,
            params: {
                link_to_post: `viz://@${spotlightPost.value.author}/${spotlightPost.value.block}`,
                to_date: (new Date()).toISOString(),
                from_date: getDateByPeriod('All').toISOString(),
            },
            lazy: true,
        })
        spotlightPost.value.shares = (result as any).shares
        return result
    }, { watch: [spotlightPost] }
)
</script>

<style>
.posts {
    max-width: 650px;
    margin: 40px auto;
    padding: 0 10px;
    font: 18px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
    color: #444
}
</style>
