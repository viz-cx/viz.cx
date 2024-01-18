<template>
    <v-card v-if="props.post != undefined" variant="outlined" hover class="post-card">

        <v-card-subtitle @click.prevent="open(props.alwaysOpened)">
            <nuxt-link :href="'/@' + props.post.author">@{{ props.post.author }}</nuxt-link>
            posted {{ !(props.post.d.i || props.post.d.s) ? 'text' : '' }}
            <span v-show="props.post.d.s">
                <nuxt-link :href="props.post.d.s" target="_blank">link</nuxt-link>
                <span v-show="showDomain(props.post.d.s)"> from <b>{{ showDomain(props.post.d.s) }}</b></span>
            </span>
            {{ props.post.d.i ? (props.post.d.s ? ' and ' : '') + 'image' : '' }}
            <ClientOnly>
                <span :title="props.post.timestamp + 'Z'">{{ timeAgo(props.post.timestamp + 'Z') }}</span>
            </ClientOnly>:
        </v-card-subtitle>

        <v-card-text @click.stop="open(true)" :class="props.post.show ? 'single-post text-opened' : 'single-post'">
            <div>{{ props.post.show ? fullPost(props.post) : truncatedText(props.post.d.t) }}</div>
            <div v-if="props.post.show && props.post.t === 'p' && props.post.d.m">
                <blockquote class="blockquote">We can't show markdown yet.</blockquote>
                <v-card class="mx-auto my-8" max-width="300" title="Show on
                            Readdle.me" append-icon="mdi-open-in-new"
                    :href="'https://readdle.me/#viz://@' + props.post.author + '/' + props.post.block + '/publication/'"
                    target="_blank" rel="noopener" link></v-card>
            </div>
        </v-card-text>

        <v-img v-show="props.post.show && props.post.d.i" aspect-ratio="16/9" cover :src="props.post.d.i">
            <template v-slot:placeholder>
                <div class="d-flex align-center justify-center fill-height">
                    <v-progress-circular color="grey-lighten-4" indeterminate></v-progress-circular>
                </div>
            </template>
        </v-img>

        <v-card-actions v-show="props.post.show">
            <ClientOnly>
                <ConfettiExplosion v-if="showConfetti" :duration="7000" :particleSize="20" :particleCount="200" />
                <Popper :class="theme" arrow placement="top">
                    <v-btn icon="$plus" @click="awardClicked()"></v-btn>
                    <template #content="{ close, isOpen }">
                        <LazyAward v-if="isOpen" :extended="false" :receiver="props.post.author"
                            :memo="'viz://@' + props.post.author + '/' + props.post.block" :negative="false"
                            @success="awardSuccess" @close="close">
                        </LazyAward>
                    </template>
                </Popper>

                <div :title="(props.post.awards ?? 0) + ' award(s)'">{{ props.post.shares !== undefined ?
                    props.post.shares.toFixed(2) : '???'
                }} VIZ</div>

                <Popper :class="theme" arrow placement="top">
                    <v-btn icon="$minus" @click="awardClicked()"></v-btn>
                    <template #content="{ close, isOpen }">
                        <LazyAward v-if="isOpen" :extended="false" receiver="cx.id"
                            :memo="'viz://@' + props.post.author + '/' + props.post.block" :negative="true"
                            @success="awardSuccess" @close="close">
                        </LazyAward>
                    </template>
                </Popper>

                <v-spacer></v-spacer>
                <div v-show="isUserAuthor(props.post.author)">
                    <v-btn icon="$edit"></v-btn>
                    <v-btn icon="$delete"></v-btn>
                </div>

            </ClientOnly>
        </v-card-actions>
    </v-card>
</template>

<script setup lang="ts">
import RelativeTime from '@yaireo/relative-time'
import Popper from "vue3-popper"
import ConfettiExplosion from "vue-confetti-explosion"

defineComponent({
    components: {
        Popper,
    },
})

const props = defineProps({
    post: Object,
    alwaysOpened: Boolean
})

const relativeTime = new RelativeTime({ locale: 'en' })
const theme = useState("theme", () => "light")
const showConfetti = ref(false)

const explodeConfetti = async () => {
    showConfetti.value = false
    await nextTick()
    showConfetti.value = true
}

function awardSuccess(reward: number, isNegative: boolean) {
    explodeConfetti()
    if (props.post) {
        if (isNegative) {
            props.post.shares -= reward
        } else {
            props.post.shares += reward
        }
    }
}

function open(alwaysOpened: boolean) {
    if (props.post) {
        props.post.show = alwaysOpened ? true : !props.post.show
    }
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
</script>

<style>
.post-card {
    color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
}

.single-post {
    white-space: pre-wrap;
}

.text-opened {
    min-height: 70px;
}
</style>
