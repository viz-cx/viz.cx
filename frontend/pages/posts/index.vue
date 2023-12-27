<template>
    <div>

        <Head>
            <Title>{{ title }}</Title>
        </Head>
        <div v-if="pending">
            <Spinner />
        </div>
        <div v-else class="posts">

            <v-card variant="outlined">
                <v-toolbar color="primary">
                    <v-toolbar-title>{{ title }}</v-toolbar-title>
                    <template v-slot:extension>
                        <v-tabs v-model="tab" align-tabs="title">
                            <v-tab v-for="item in tabs" :key="item" :value="item">
                                {{ item }}
                            </v-tab>
                        </v-tabs>
                    </template>
                </v-toolbar>
                <!-- <v-window v-model="tab">
                    <v-window-item v-for="item in tabs" :key="item" :value="item">
                        <v-card flat>
                            <v-card-text v-text="text"></v-card-text>
                        </v-card>
                    </v-window-item>
                </v-window> -->
            </v-card>
            <br />

            <v-card v-if="tab !== 'newest'" variant="outlined" hover>
                <v-card-text>This tab isn't implemented yet.</v-card-text>
            </v-card>

            <div v-if="tab === 'newest'" v-for="post in posts">
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

                    <v-card-text @click.stop="post.show = true; spotlightPost = post"
                        :class="post.show ? 'text-opened' : ''">
                        {{ post.show ? fullPost(post) : truncatedText(post.d.t) }}
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
            <v-btn v-if="tab === 'newest'" v-show="showMoreButton" @click.prevent="loadMore()">Show next {{ page + 2 }}
                page</v-btn>
        </div>
    </div>
</template>

<script setup lang="ts">
import RelativeTime from '@yaireo/relative-time'
import Popper from "vue3-popper"
const relativeTime = new RelativeTime({ locale: 'en' })
const theme = useState("theme", () => "light")

defineComponent({
    components: {
        Popper,
    },
})

const title = 'Voice Protocol Posts'
const page = ref(0)
const pending = ref(false)
const posts: any = ref([])
const showMoreButton = ref(true)

const tab = ref<string>("")
const tabs = ['newest', 'popular']
const config = useRuntimeConfig()
useAsyncData("/posts/", async (): Promise<void> => {
    const result: any = await $fetch(`/posts/page/${page.value}`, {
        baseURL: config.public.apiBaseUrl
    })
    if (result.length === 0) {
        showMoreButton.value = false
        return
    }
    posts.value = posts.value.concat(result)
    pending.value = false
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
            link_to_post: `viz://@${spotlightPost.value.author}/${spotlightPost.value.block}`,
            to_date: (new Date()).toISOString(),
            from_date: getDateByPeriod('All').toISOString(),
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

.posts {
    max-width: 650px;
    margin: 20px auto;
    padding: 0 10px;
    color: #444;
}

.dark {
    --popper-theme-background-color: #333;
    --popper-theme-background-color-hover: #333;
    /* --popper-theme-text-color: #eeeeee; */
    --popper-theme-border-width: 0px;
    --popper-theme-border-radius: 6px;
    --popper-theme-padding: 0px;
    --popper-theme-box-shadow: 0 6px 30px -6px rgba(0, 0, 0, 0.25);
}

.light {
    --popper-theme-background-color: #ffffff;
    --popper-theme-background-color-hover: #ffffff;
    --popper-theme-text-color: #333333;
    --popper-theme-border-width: 1px;
    --popper-theme-border-style: solid;
    --popper-theme-border-color: #eeeeee;
    --popper-theme-border-radius: 6px;
    --popper-theme-padding: 0px;
    --popper-theme-box-shadow: 0 6px 30px -6px rgba(0, 0, 0, 0.25);
}
</style>
