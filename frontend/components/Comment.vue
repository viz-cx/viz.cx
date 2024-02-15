<template>
    <article :id="`comment${props.comment?.block}`" class="comment-details">
        <header>
            <!-- <img align="left" class="u-square micro" src="/ava.png" /> -->
            <p>
                <b><nuxt-link :href="'/@' + props.comment?.author + '/' + props.comment?.block">{{ props.comment?.author
                }}</nuxt-link></b>&nbsp;&nbsp;&nbsp;<nuxt-link
                    :href="`#comment${props.comment?.block}`">#</nuxt-link>
                <span :title="props.comment?.timestamp + 'Z'">{{ timeAgo(props.comment?.timestamp + 'Z') }}</span>
                <span class="navright">
                    <ClientOnly>
                        <RateButtons :author="props.comment?.author"
                            :memo="'viz://@' + props.comment?.author + '/' + props.comment?.block"
                            :awards="props.comment?.awards" :shares="props.comment?.shares" />
                    </ClientOnly>
                </span>
            </p>
        </header>
        <div class="comment comment-details__comment">
            {{ props.comment?.d.t }}
        </div>

        <button v-if="props.activeReply !== postId(props.comment) && fakeComment === undefined"
            @click.stop="handleReplyChange(postId(props.comment))" class="comment-details__button"
            type="button">Reply</button>
        <CommentEditor @success="newComment" :isReply="true" :reply="toVoiceLink(props.comment)"
            v-if="props.activeReply === postId(props.comment) && fakeComment === undefined"
            class="comment-details__reply" />

        <ul class="comment-details__children">
            <Comment v-if="fakeComment !== undefined" :comment="fakeComment" :fake="true" />
            <Comment v-if="props.comment?.replies" v-for="reply in props.comment.replies" v-bind="{ comment: reply }"
                @change-active-reply="handleReplyChange" :active-reply="props.activeReply" />
        </ul>
    </article>
</template>

<script setup lang="ts">
import RelativeTime from '@yaireo/relative-time'
import Popper from "vue3-popper"

function handleReplyChange(commentId: any) {
    emits('changeActiveReply', commentId)
}

defineComponent({
    components: {
        Popper,
    },
})

const emits = defineEmits(['changeActiveReply'])

const props = defineProps({
    comment: Object,
    fake: Boolean,
    activeReply: String
})

const relativeTime = new RelativeTime({ locale: 'en' })
function timeAgo(date: string): string {
    return relativeTime.from(new Date(date))
}

const fakeComment: Ref<any> = ref(undefined)
function newComment(content: any) {
    const timestamp = new Date().toISOString().slice(0, -1) // "2024-01-18T16:05:27"
    const comment: any = {
        "block": 0,
        "author": useCookie('login').value ?? "",
        "d": {
            't': content,
        },
        "shares": 0,
        "timestamp": timestamp,
        "isFake": true
    }
    fakeComment.value = comment
}
</script>

<style scoped>
.comment-details {
    padding-left: 10px;
    list-style: none;
    border-left: 2px solid #eee;
    padding-top: 15px;
}

.comment__metadata {
    display: flex;
    /* color: gray; */
    margin-bottom: 5px;
    /* font-size: 12px; */
    align-items: center;
}

.comment-details__comment {
    white-space: pre-wrap;
}

.comment-details__children,
.comment-details__reply {
    margin-left: 10px !important;
}

.comment-details__button {
    display: block;
    /* color: #1976d2; */
    font-size: 16px;
    margin: 5px 0;
    padding: 0;
    border: 0;
    cursor: pointer;
}

.comment-details__button:hover,
.comment-details__button:focus {
    text-decoration: underline;
}
</style>

