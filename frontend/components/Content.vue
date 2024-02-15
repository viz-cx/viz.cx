<template>
    <span v-if="props.post">

        <div v-if="props.opened">
            <div v-if="props.post.t === 'p' && props.post.d.m">
                <h3 v-html="markdownTitle(props.post.d.t)" />
                <span v-html=markdown(props.post.d.m)></span>
            </div>
            <div v-else>
                <!-- <h3>Note #{{ props.post.block }}</h3> -->
                <div v-html="highlight_links(fullPost(props.post), false)" />
            </div>
        </div>

        <div v-else>
            <div v-if="props.post.t === 'p'">
                <nuxt-link :href="'/@' + props.post.author + '/' + props.post.block">
                    <h3 v-html="markdownTitle(props.post.d.t)" />
                </nuxt-link>
                {{ props.post.d.d }}
            </div>
            <div v-else>
                <!-- <nuxt-link :href="'/@' + props.post.author + '/' + props.post.block">
                    <h3>Note #{{ props.post.block }}</h3>
                </nuxt-link> -->
                {{ truncatedText(props.post.d.t) }}
            </div>
        </div>
        <!-- <v-img v-if="props.post.d.i" :src="props.post.d.i">
            <template v-slot:placeholder>
                <div class="d-flex align-center justify-center fill-height">
                    <Spinner />
                </div>
            </template>
        </v-img> -->
    </span>
</template>

<script setup lang="ts">
const props = defineProps({
    post: Object,
    opened: Boolean,
})

function truncatedText(text: string): string {
    let newText = fixBreakLines(text.substring(0, 280))
    if (text.length === newText.length) {
        return newText
    }
    return newText + '...'
}

function fullPost(post: any) {
    let result = fixBreakLines(post.d.t)
    return result
}

function fixBreakLines(text: string): string {
    return text.replace(/\r\n/g, '\n')
}
</script>