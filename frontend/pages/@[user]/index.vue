<template>
    <Head>
        <Title>{{ (capitalize(user) + "'s profile") }}</Title>
    </Head>
    <div v-if="pending">
        <Spinner />
    </div>
    <div v-else-if="error">
        <h3>{{ error }}</h3>
    </div>
    <div v-else>
        <section>
            <img align="left" style="margin-right:20px" class="u-square medium"
                :src="`${config.public.apiBaseUrl}/profile/avatar/${user}`">
            {{ profileName(profile) }}
            <br>{{ profile?.json_metadata?.profile?.about ?? '' }}
        </section>
        <hr />
        <PostList tab="newest" :author="user" />
    </div>
</template>

<script setup lang="ts">
const route = useRoute()
const user: string = (typeof route.params.user === 'string') ? route.params.user : route.params.user[0]
const config = useRuntimeConfig()
const { pending, error, data: profile } = useAsyncData("fetch user profile",
    async () => $fetch(`/profile/${user}`, {
        baseURL: config.public.apiBaseUrl
    }),
    {
        transform: (data: any) => {
            return data
        },
    }
)

const profileName = (profile: any) => {
    if (!profile) { return user }
    if (profile?.json_metadata?.profile?.nickname) {
        if (profile?.json_metadata?.profile?.nickname !== user) {
            return `${profile?.json_metadata?.profile?.nickname} (@${user})`
        }
        return profile?.json_metadata?.profile?.nickname
    }
    return user
}
</script>
