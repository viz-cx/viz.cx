<template>
    <Head>
        <Title>{{ capitalize(title) }}'s profile</Title>
    </Head>
    <div v-if="loading">
        <Spinner />
    </div>
    <div v-else>
        <h1>{{ title }}</h1>
        <v-avatar :image="avatar" size="100" :alt="title"></v-avatar>
        {{ about }}
        <br /><br />
        <PostList tab="newest" :author="user" />
    </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'

let loading = ref(true)
let title = ref('')
let avatar = ref('')
let about = ref('')
let post: Ref<string | undefined> = ref(undefined)
let total = ref(0)

const route = useRoute()
const user: string = (typeof route.params.user === 'string') ? route.params.user : route.params.user[0]

onBeforeMount(async () => {
    await getAccount(user).then((account: any) => {
        if (account['json_metadata'] && account['json_metadata'] !== '') {
            let profile = JSON.parse(account['json_metadata'])['profile']
            title.value = account['name']
            avatar.value = profile['avatar']
            about.value = profile['about']
        } else {
            title.value = account['name']
        }
        if (account['custom_sequence_block_num'] !== 0) {
            post.value = 'viz://@' + account['name'] + '/' + account['custom_sequence_block_num']
            total.value = account['custom_sequence']
        }
        loading.value = false
    }, (err) => {
        console.log(err)
        title.value = err
        loading.value = false
    })
})
</script>
