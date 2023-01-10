<template>
    <div>
        <div v-if="pending || !data">Post not found.</div>
        <div v-else>

            <Head>
                <Title>{{ data['title'] }}</Title>
                <Meta v-if="data['description']" name="description" :content="titleFromText(data['description'])" />
            </Head>
            <a v-if="data['prev']" :href="data['prev']">Previous post</a>
            <div v-if="data['description']" v-html="data['description']"></div>
            <img v-if="data['image']" :src="data['image']" />
            <div v-if="data['reply']">
                <a :href="'/' + data['reply'].replace('viz://', '')">
                    Reply to {{ data['reply'].replace('viz://', '') }}
                </a>
            </div>
            <div v-if="data['share']">
                <a :href="data['share'].replace('viz://', '/')">
                    Shared post: {{ data['share'].replace('viz://', '') }}
                </a>
            </div>
            <h1 v-if="data['title']" v-html="data['title']"></h1>
            <div v-if="data['text']" v-html="data['text']"></div>
        </div>
    </div>
</template>

<script setup lang="ts">
const route = useRoute()
const config = useRuntimeConfig()
const { pending, data } = await useAsyncData(
    "/blocks",
    async () => $fetch(config.public.apiBaseUrl + "/blocks/" + route.params.block),
    {
        transform: (data: any) => {
            let json = JSON.parse(
                data["block"].filter((trx: any) => {
                    return (
                        trx["op"][0] === "custom" &&
                        trx["op"][1]["required_regular_auths"][0] === route.params.user
                    )
                })[0]["op"][1]["json"]
            )
            let result: {
                "title": string | undefined,
                "text": string | undefined,
                "prev": string | undefined,
                "reply": string | undefined,
                "share": string | undefined,
                "description": string | undefined,
                "image": string | undefined
            } = {
                title: undefined,
                text: undefined,
                prev: undefined,
                reply: undefined,
                share: undefined,
                description: undefined,
                image: undefined
            }
            if (json['t'] === 'p') { // Extended post with markdown markup
                result['title'] = markdownTitle(json['d']['t'])
                result['text'] = markdown(json['d']['m'])
            } else {
                if (json["d"]["text"]) {
                    result['title'] = titleFromText(json["d"]["text"])
                    result['text'] = json["d"]["text"]
                }
                if (json["d"]["t"]) {
                    result['title'] = titleFromText(json["d"]["t"])
                    result['text'] = json["d"]["t"]
                }
            }
            if (json['p']) {
                result['prev'] = '/@' + route.params.user + '/' + json['p'] + '/'
            }
            if (json['d']['r']) {
                result['reply'] = json['d']['r']
            }
            if (json['d']['s']) {
                result['share'] = json['d']['s']
            }
            if (json['d']['d']) {
                result['description'] = json['d']['d']
            }
            if (json['d']['i']) {
                result['image'] = json['d']['i']
            }
            return result
        },
    }
)
</script>

<style>
img {
    max-width: 100%;
}
</style>
