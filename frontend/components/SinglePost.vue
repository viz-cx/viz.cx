<template>
    <v-card v-if="props.post != undefined" variant="outlined" hover :loading="props.fakePost">

        <v-card-subtitle @click.prevent="open(props.alwaysOpened)">
            <nuxt-link :href="'/@' + props.post.author">@{{ props.post.author }}</nuxt-link>
            posted
            <nuxt-link v-if="!props.alwaysOpened && !props.fakePost"
                :to="'/@' + props.post.author + '/' + props.post.block">
                {{ (props.post.t === 'p') ? 'text' : 'note' }}</nuxt-link>
            <span v-if="props.alwaysOpened || props.fakePost">{{ (props.post.t === 'p') ? 'text' :
                'note' }}</span>
            <span v-show="props.post.d.s">
                {{ ' with ' }}
                <nuxt-link :href="props.post.d.s" target="_blank">link</nuxt-link>
            </span>
            {{ ' ' }}
            <span v-if="props.post.d.r">
                in reply to <nuxt-link :to="voiceLink(props.post.d.r)">{{ voiceLink(props.post.d.r, false)
                }}</nuxt-link>{{ ' ' }}
            </span>
            <ClientOnly>
                <span :title="props.post.timestamp + 'Z'">{{ timeAgo(props.post.timestamp + 'Z') }}</span>
            </ClientOnly>:
        </v-card-subtitle>

        <v-card-text @click.stop="open(true)" :class="props.post.show ? 'article text-opened' : 'article'">
            <div v-if="props.post.t === 'p' && props.post.d.m">
                <h3 v-html="markdownTitle(props.post.d.t)"></h3><br />
                <span v-if="props.post.show" v-html=markdown(props.post.d.m)></span>
                <span v-else>
                    {{ props.post.d.d ?? '' }}
                </span>
            </div>
            <div v-else>
                {{ props.post.show ? fullPost(props.post) : truncatedText(props.post.d.t) }}
            </div>
            <v-img v-show="!props.post.show && props.post.d.i" :src="props.post.d.i">
                <template v-slot:placeholder>
                    <div class="d-flex align-center justify-center fill-height">
                        <Spinner />
                    </div>
                </template>
            </v-img>
        </v-card-text>

        <v-card-actions v-if="!props.fakePost" v-show="props.post.show">
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
    alwaysOpened: Boolean,
    fakePost: Boolean
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
.article {
    white-space: pre-wrap;
}

.article img {
    width: 100%;
}

.article ul {
    padding-left: 0;
    list-style-position: inside;
}

.article ol {
    padding-left: 0;
    list-style-position: inside;
}

.article blockquote {
    display: block;
    padding: 20px 15px;
    border-left: 2px solid #000;
    padding-right: 0;
    margin: 0;
    font-style: normal;
}

blockquote {
    display: block;
    margin-block-start: 1em;
    margin-block-end: 1em;
    margin-inline-start: 40px;
    margin-inline-end: 40px;
}

.article cite {
    &:before {
        content: "";
        text-align: center;
        display: block;
        width: 100px;
        position: absolute;
        border-top: 2px solid #000;
        left: calc(50% - 50px);
        margin-top: -10px;
    }

    display: block;
    text-align: center;
    font-style: normal;

    &:after {
        content: "";
        text-align: center;
        display: block;
        width: 100px;
        position: absolute;
        border-bottom: 2px solid #000;
        left: calc(50% - 50px);
        margin-top: 15px;
    }
}

.article hr {
    font-weight: 400;
    height: auto;
    border: 0;
    display: block;
    background: none;
    margin: 0;
    clear: both;

    &:before {
        content: "*****";
        font-size: 28px;
        text-align: center;
        display: block;
    }
}

.text-opened {
    min-height: 70px;
}

.fake {
    background-color: #fcfcfc;
}
</style>
