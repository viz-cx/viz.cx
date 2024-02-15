<template>
    <article v-if="props.post">
        <header>
            <!-- <nuxt-link :href="'/@' + props.post.author"><img align="left" class="u-square micro"
                    src="/author.png" /></nuxt-link> -->
            <p>
                <nuxt-link :href="'/@' + props.post.author">@{{ props.post.author }}</nuxt-link>&nbsp;&nbsp;&nbsp;
                <nuxt-link :href="'/@' + props.post.author + '/' + props.post.block">
                    <span :title="props.post.timestamp + 'Z'">{{ timeAgo(props.post.timestamp + 'Z') }}</span>
                </nuxt-link>
                <span class="navright">
                    {{ readingTime(props.post.d.m ?? props.post.d.t) }}
                </span>
            </p>
        </header>
        <section>
            <Content :post="props.post" :opened="false" />
            <div class="comment">
                <nuxt-link :href="'/@' + props.post.author + '/' + props.post.block + '#comments'">comments: {{
                    props.post.comments ?? 0 }}</nuxt-link>
            </div>
            <hr />
        </section>
    </article>
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
})

const relativeTime = new RelativeTime({ locale: 'en' })
function timeAgo(date: string): string {
    return relativeTime.from(new Date(date))
}
</script>
