<template>
    <div class="comment-details">
        <span wrap align-baseline v-if="props.comment !== undefined">
            <v-col xs12 class="comment-details__comment">
                <span class="comment__metadata">
                    <strong>{{ props.comment?.author }}</strong> &bull;
                    <ClientOnly>
                        <span :title="props.comment.timestamp + 'Z'">{{ timeAgo(props.comment.timestamp + 'Z') }}</span>
                    </ClientOnly>
                </span>

                <span class="comment-details__comment">{{ props.comment.d.t }}</span>

                <button v-if="props.activeReply !== postId(props.comment)"
                    @click.stop="handleReplyChange(postId(props.comment))" class="comment-details__button"
                    type="button">Reply</button>
                <CommentEditor :parent="props.comment" v-if="props.activeReply === postId(props.comment)"
                    class="comment-details__reply" />
            </v-col>


            <ul v-if="props.comment.replies && props.comment.replies.length > 0" class="comment-details__children">
                <Comment v-for="reply in props.comment.replies" v-bind="{ comment: reply }"
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
</script>

<style scoped>
.comment-details {
    padding-left: 10px;
    list-style: none;
    border-left: 2px solid #eee;
}

.comment__metadata {
    display: block;
    color: gray;
    margin-bottom: 5px;
    font-size: 12px;
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

