<template>
    <div v-if="loading">
        <Spinner />
    </div>
    <div v-else>

        <Head>
            <Title>{{ title }}</Title>
        </Head>
        <h1>{{ title }}</h1>
        <v-avatar :image="avatar" size="100" :alt="title"></v-avatar>
        {{ about }}
    </div>
</template>

<script setup lang="ts">
let loading = ref(true)
let title = ref('')
let avatar = ref('')
let about = ref('')

onBeforeMount(async () => {
    const route = useRoute()
    let user: string = (typeof route.params.user === 'string') ? route.params.user : route.params.user[0]
    await getAccount(user).then((account: any) => {
        let profile = JSON.parse(account['json_metadata'])['profile']
        title.value = profile['nickname'] ?? account['name']
        avatar.value = profile['avatar']
        about.value = profile['about']
        loading.value = false
    }, (err) => {
        console.log(err)
        title.value = err
        loading.value = false
    })
})
</script>
