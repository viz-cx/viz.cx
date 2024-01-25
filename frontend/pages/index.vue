<template>
    <Head>
        <Title>{{ title }}</Title>
    </Head>
    <div>
        <v-card variant="outlined">
            <v-toolbar color="primary">
                <v-toolbar-title>{{ title }}</v-toolbar-title>
                <template v-slot:extension>
                    <v-tabs v-model="tab" align-tabs="title">
                        <v-tab v-for="item in tabs" :key="item" :value="item" @click="updateRoute(item)">
                            {{ item }}
                        </v-tab>
                    </v-tabs>
                </template>
            </v-toolbar>
        </v-card>
        <br />
        <div v-if="tab == 'newest'">
            <SimpleEditor @success="newPost" />
            <br />
            <div v-for="post in newPosts" :id="post.author + '/' + 0">
                <SinglePost :post="post" :fake-post="true" />
                <br />
            </div>
        </div>
        <PostList v-for="value in tabs" :tab="value" v-show="value === tab" />
    </div>
</template>

<script setup lang="ts">
const router = useRouter()
const title = 'VIZ Blockchain Community'
const tab = ref<string | null>(null)
const tabs = ['popular', 'newest', 'replies']
const tabFromRouteHash = router.currentRoute.value.hash.replace('#', '')
if (tabs.includes(tabFromRouteHash)) {
    tab.value = tabFromRouteHash
}

function updateRoute(tab: string | null) {
    router.replace({ 'hash': '#' + tab })
}

const newPosts: Ref<any[]> = ref([])
function newPost(content: any) {
    const timestamp = new Date().toISOString().slice(0, -1) // "2024-01-18T16:05:27"
    const newPost: any = {
        "block": 0,
        "author": useCookie('login').value ?? "",
        "d": {
            't': content
        },
        "shares": 0,
        "timestamp": timestamp
    }
    newPosts.value.unshift(newPost)
}
</script>
