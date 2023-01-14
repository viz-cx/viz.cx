<template>
    <div>
        <div v-if="pending">
            <Spinner />
        </div>
        <div v-else-if="!data">
            Post not found.
        </div>
        <div v-else>

            <Head>
                <Title>{{ data['title'] }}</Title>
                <Meta v-if="data['description']" name="description" :content="titleFromText(data['description'])" />
            </Head>
            <v-breadcrumbs :items="[
                { title: 'Home', href: '/' },
                { title: '@' + $route.params.user, href: '/@' + $route.params.user },
                { title: $route.params.block, href: '/@' + $route.params.user + '/' + $route.params.block }
            ]"></v-breadcrumbs>
            <div v-if="data['prev']">
                Previous post: <nuxt-link :to="voiceLink(data['prev'])">
                    {{ voiceLink(data['prev'], false) }}
                </nuxt-link>
            </div>
            <div v-if="data['description']" v-html="data['description']"></div>
            <div v-if="data['image']">
                <img :src="data['image']" />
            </div>
            <div v-if="data['reply']">
                Reply to <nuxt-link :to="voiceLink(data['reply'])">
                    {{ voiceLink(data['reply'], false) }}
                </nuxt-link>
            </div>
            <div v-if="data['share']">
                Shared link: <nuxt-link :to="voiceLink(data['share'])">
                    {{ voiceLink(data['share'], false) }}
                </nuxt-link>
            </div>
            <h1 v-if="data['title']" v-html="data['title']"></h1>
            <div v-if="data['text']" v-html="data['text']"></div>
        </div>
        <v-container>
            <v-row justify="space-between" class="text-center">
                <v-col v-if="pendingStats">
                    <Spinner />
                </v-col>
                <v-col v-else>
                    <v-menu transition="slide-x-transition" v-model="menu" :close-on-content-click="false"
                        location="end">
                        <template v-slot:activator="{ props }">
                            <v-btn icon="mdi-heart" color="primary" v-bind="props"></v-btn>
                        </template>
                        <Award />
                    </v-menu>
                    {{ stats['awards'] }} awards with {{ stats['shares'].toFixed(3) }} shares
                </v-col>
            </v-row>
        </v-container>
    </div>
</template>

<script setup lang="ts">
let menu = ref(false)
const route = useRoute()
const config = useRuntimeConfig()

const params = {
    link_to_post: 'viz://@' + route.params.user + '/' + route.params.block,
    to_date: (new Date()).toISOString(),
    from_date: getDateByPeriod('All').toISOString(),
}
const { pending: pendingStats, data: stats } = useAsyncData(params.link_to_post,
    async (): Promise<any> => $fetch("voice/post", {
        baseURL: config.public.apiBaseUrl,
        params: params
    })
)

watch([stats], (newValue) => {
    console.log(newValue)
})

const { pending, data } = useAsyncData(
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
                result['prev'] = 'viz://@' + route.params.user + '/' + json['p']
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
