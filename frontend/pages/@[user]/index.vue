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
        <v-card>
            <v-toolbar color="primary" height="100">
                <v-avatar v-show="!pending" :image="profile?.json_metadata?.profile?.avatar" size="75" :alt="user"
                    color="grey" style="margin-left:12px;"></v-avatar>
                <v-list-item v-show="!pending">
                    <v-list-item-title v-text="profileName(profile)"></v-list-item-title>
                    <v-spacer></v-spacer>
                    <v-list-item-subtitle class="text-wrap"
                        v-text="profile?.json_metadata?.profile?.about ?? ''"></v-list-item-subtitle>
                </v-list-item>
            </v-toolbar>
        </v-card>
        <br />
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
            return `${profile?.json_metadata?.profile?.nickname} (${user})`
        }
        return profile?.json_metadata?.profile?.nickname
    }
    return user
}
</script>
