<template>
    <Head>
        <Title>{{ (capitalize(user) + "'s profile") }}
        </Title>
    </Head>
    <v-card>
        <v-toolbar color="primary">
            <Spinner v-show="pending" />
            <v-avatar v-show="!pending" :image="profile?.meta?.profile?.avatar ?? defaultAvatar" size="75" :alt="user"
                color="grey" style="margin-left:12px;"></v-avatar>
            <v-list-item v-show="!pending" :title="profile?.meta?.profile?.nickname ?? user"
                :subtitle="profile?.meta?.profile?.about ?? ''"></v-list-item>
        </v-toolbar>
    </v-card>
    <br />
    <PostList tab="newest" :author="user" />
</template>

<script setup lang="ts">
const defaultAvatar = "https://info.viz.plus/default-avatar.png"
const route = useRoute()
const user: string = (typeof route.params.user === 'string') ? route.params.user : route.params.user[0]
const config = useRuntimeConfig()
const { pending, data: profile } = useAsyncData("fetch user profile",
    async () => $fetch(`/profile/${user}`, {
        baseURL: config.public.apiBaseUrl
    }),
    {
        transform: (data: any) => {
            return data
        },
    }
)
</script>
