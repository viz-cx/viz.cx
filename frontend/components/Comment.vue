<template>
    <div class="comment-details">
        <span wrap align-baseline v-if="props.comment !== undefined">
            <v-col class="comment-details__comment">
                <span class="comment__metadata">
                    <b><nuxt-link :href="'/@' + props.comment.author">{{ props.comment.author }}</nuxt-link></b>
                    &nbsp;&bull;&nbsp;
                    <ClientOnly>
                        <span :title="props.comment.timestamp + 'Z'">{{ timeAgo(props.comment.timestamp + 'Z') }}</span>
                    </ClientOnly>

                    <v-spacer></v-spacer>

                    <RateButtons :author="props.comment.author"
                        :memo="'viz://@' + props.comment.author + '/' + props.comment.block" :awards="props.comment.awards"
                        :shares="props.comment.shares" />
                </span>

                <span class="comment-details__comment">{{ props.comment.d.t }}</span>

                <button v-if="props.activeReply !== postId(props.comment) && fakeComment === undefined"
                    @click.stop="handleReplyChange(postId(props.comment))" class="comment-details__button"
                    type="button">Reply</button>
                <CommentEditor @success="newComment" :isReply="true" :reply="toVoiceLink(props.comment)"
                    v-if="props.activeReply === postId(props.comment) && fakeComment === undefined"
                    class="comment-details__reply" />
            </v-col>
            <ul class="comment-details__children">
                <Comment v-if="fakeComment !== undefined" :comment="fakeComment" :fake="true" />
                <Comment v-if="props.comment.replies" v-for="reply in props.comment.replies" v-bind="{ comment: reply }"
                    @change-active-reply="handleReplyChange" :active-reply="props.activeReply" />
            </ul>
        </span>
    </div>
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
    font-size: 15px;
}

.comment__metadata {
    display: flex;
    /* color: gray; */
    margin-bottom: 5px;
    font-size: 12px;
    align-items: center;
}

.comment-details__children,
.comment-details__reply {
    margin-left: 25px !important;
}

.comment-details__button {
    display: block;
    /* color: #1976d2; */
    font-size: 12px;
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

