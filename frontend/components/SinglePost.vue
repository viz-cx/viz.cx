<template>
    <v-card v-if="props.post !== undefined" variant="outlined" :hover="!props.alwaysOpened" :loading="props.fakePost">

        <v-card-subtitle @click.prevent="open(props.alwaysOpened)">
            <b><nuxt-link :href="'/@' + props.post.author">{{ props.post.author }}</nuxt-link></b>
            posted
            <nuxt-link v-if="!props.alwaysOpened && !props.fakePost"
                :to="'/@' + props.post.author + '/' + props.post.block">
                {{ (props.post.t === 'p') ? 'text' : 'note' }}</nuxt-link>
            <span v-if="props.alwaysOpened || props.fakePost">{{ (props.post.t === 'p') ? 'text' :
                'note' }}</span>
            <span v-if="props.post.d.s">
                {{ ' about ' }}
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
            <div v-else-if="props.post.show" v-html="highlight_links(fullPost(props.post), false)"></div>
            <div v-else>{{ truncatedText(props.post.d.t) }} </div>
            <v-img v-if="!props.post.show && props.post.d.i" :src="props.post.d.i">
                <template v-slot:placeholder>
                    <div class="d-flex align-center justify-center fill-height">
                        <Spinner />
                    </div>
                </template>
            </v-img>
        </v-card-text>

        <v-card-actions v-if="!props.fakePost" v-show="props.post.show">
            <ClientOnly>
                <RateButtons :author="props.post.author" :memo="'viz://@' + props.post.author + '/' + props.post.block"
                    :awards="props.post.awards" :shares="props.post.shares" />
                <v-spacer></v-spacer>
                <!-- <div v-if="isUserAuthor(props.post.author)">
                    <v-btn aria-label="Edit post" icon="$edit"></v-btn>
                    <v-btn aria-lable="Delete post" icon="$delete"></v-btn>
                </div> -->
                <div class="mr-2">
                    <v-badge :content="props.post.comments ?? 0">
                        <v-btn aria-label="to comments"
                            :href="'/@' + props.post.author + '/' + props.post.block + '#comments'"
                            icon="mdi-message-reply-text-outline"></v-btn>
                    </v-badge>
                </div>
            </ClientOnly>
        </v-card-actions>
    </v-card>
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
    post: Object,
    alwaysOpened: Boolean,
    fakePost: Boolean
})

function open(alwaysOpened: boolean) {
    if (props.post) {
        props.post.show = alwaysOpened ? true : !props.post.show
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

const relativeTime = new RelativeTime({ locale: 'en' })
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
</style>
