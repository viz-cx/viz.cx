<template>
    <div>
        <div v-for="post in posts">
            <v-card variant="outlined" hover>

                <v-card-subtitle @click.prevent="post.show = !post.show; spotlightPost = post">
                    <nuxt-link :href="'/@' + post.author">@{{ post.author }}</nuxt-link>
                    posted {{ !(post.d.i || post.d.s) ? 'text' : '' }}
                    <span v-show="post.d.s">
                        <nuxt-link :href="post.d.s" target="_blank">link</nuxt-link>
                        <span v-show="showDomain(post.d.s)"> from <b>{{ showDomain(post.d.s) }}</b></span>
                    </span>
                    {{ post.d.i ? (post.d.s ? ' and ' : '') + 'image' : '' }}
                    <ClientOnly>{{ timeAgo(post.timestamp + 'Z') }}</ClientOnly>:
                </v-card-subtitle>

                <v-card-text @click.stop="post.show = true; spotlightPost = post" :class="post.show ? 'text-opened' : ''">
                    {{ post.show ? fullPost(post) : truncatedText(post.d.t) }}

                    <div v-if="post.show && post.t === 'p' && post.d.m">
                        <blockquote class="blockquote">We can't show markdown yet.</blockquote>
                        <v-card class="mx-auto my-8" max-width="300" title="Show on
                            Readdle.me" append-icon="mdi-open-in-new"
                            :href="'https://readdle.me/#viz://@' + post.author + '/' + post.block + '/publication/'"
                            target="_blank" rel="noopener" link></v-card>
                    </div>
                </v-card-text>

                <v-img v-show="post.show && post.d.i" aspect-ratio="16/9" cover :src="post.d.i">
                    <template v-slot:placeholder>
                        <div class="d-flex align-center justify-center fill-height">
                            <v-progress-circular color="grey-lighten-4" indeterminate></v-progress-circular>
                        </div>
                    </template>
                </v-img>

                <v-card-actions v-show="post.show">

                    <Popper :class="theme" arrow placement="top">
                        <v-btn icon="$plus" @click="awardClicked()"></v-btn>
                        <template #content>
                            <LazyAward :show="isAuthenticated()" :extended="false" :receiver="post.author"
                                :memo="'viz://@' + post.author + '/' + post.block" :negative="false">
                            </LazyAward>
                        </template>
                    </Popper>

                    {{ post.shares !== undefined ? post.shares.toFixed(2) : '???' }} VIZ

                    <Popper :class="theme" arrow placement="top">
                        <v-btn icon="$minus" @click="awardClicked()"></v-btn>
                        <template #content>
                            <LazyAward :show="isAuthenticated()" :extended="false" receiver="cx.id"
                                :memo="'viz://@' + post.author + '/' + post.block" :negative="true"></LazyAward>
                        </template>
                    </Popper>

                    <v-spacer></v-spacer>
                    <div v-show="isUserAuthor(post.author)">
                        <v-btn icon="$edit"></v-btn>
                        <v-btn icon="$delete"></v-btn>
                    </div>

                </v-card-actions>
            </v-card>
            <br />
        </div>
        <v-btn v-show="showMoreButton" @click.prevent="loadMore()">Show next {{ page + 2 }}
            page</v-btn>
    </div>
</template>

<script setup lang="ts">
import RelativeTime from '@yaireo/relative-time'
import Popper from "vue3-popper"

defineComponent({
    components: {
        Popper,
    },
})

const props = defineProps({
    tab: String,
    author: String
})

const relativeTime = new RelativeTime({ locale: 'en' })
const theme = useState("theme", () => "light")

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

function awardClicked() {
    if (!isAuthenticated()) {
        const router = useRouter()
        router.push('/login')
    }
}

function showDomain(link: string): string | undefined {
    try {
        return (new URL(link)).hostname.replace('www.', '')
    } catch (_) {
        return undefined
    }
}

function fullPost(post: any) {
    let result = fixBreakLines(post.d.t)
    return result
}

function fixBreakLines(text: string): string {
    return text.replace(/\r\n/g, '\n')
}

function isUserAuthor(author: string): boolean {
    return author === useCookie('login').value
}

function truncatedText(text: string): string {
    let newText = fixBreakLines(text.substring(0, 280))
    if (text.length === newText.length) {
        return newText
    }
    return newText + '...'
}

function timeAgo(date: string): string {
    return relativeTime.from(new Date(date))
}

let spotlightPost = ref()
useAsyncData("fetch shares", async (): Promise<any> => {
    const result = await $fetch("voice/post", {
        baseURL: config.public.apiBaseUrl,
        params: {
            link_to_post: `viz://@${spotlightPost.value.author}/${spotlightPost.value.block}`
        },
        lazy: true,
    })
    spotlightPost.value.shares = (result as any).shares
    return
}, { watch: [spotlightPost] })
</script>

<style>
.text-opened {
    min-height: 70px;
}
</style>
