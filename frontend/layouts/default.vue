<template>
    <v-app :theme="theme">

        <v-navigation-drawer v-model="showMenu" location="end" temporary>
            <v-list dense nav>
                <v-list-item v-if="isAuthenticated()" lines="two" :prepend-avatar="avatar" :title="login"
                    subtitle="Logged in" href="/logout"></v-list-item>
                <v-divider></v-divider>
                <v-list-item v-for="item in items" :key="item.title" :to="item.value">
                    <v-list-item-title>{{ item.title }}</v-list-item-title>
                </v-list-item>
            </v-list>
        </v-navigation-drawer>

        <v-app-bar title="VIZ">
            <v-spacer></v-spacer>
            <v-btn icon="mdi-plus-box-outline" to="/posts/new" />
            <v-btn :prepend-icon="theme === 'light' ? 'mdi-weather-sunny' : 'mdi-weather-night'"
                @click="changeTheme"></v-btn>
            <v-app-bar-nav-icon variant="text" @click.stop="showMenu = !showMenu"></v-app-bar-nav-icon>
        </v-app-bar>

        <v-main>
            <v-container>
                <slot />
            </v-container>
        </v-main>
    </v-app>
</template>

<script setup lang="ts">
const theme = useState("theme", () => "light")
function changeTheme() {
    theme.value = theme.value === "light" ? "dark" : "light"
}

let login = useCookie('login').value ?? ""
let avatar = useCookie('avatar').value ?? "https://info.viz.plus/default-avatar.png"
let showMenu = ref(false)
let items = [
    {
        title: "Home",
        value: "/",
    },
    {
        title: "Telegram Channels",
        value: "/telegram/channels",
    },
    {
        title: "Telegram Posts",
        value: "/telegram/posts",
    },
    {
        title: "Voice Posts",
        value: "/voice/posts",
    },
    {
        title: "Voice Accounts",
        value: "/voice/accounts"
    },
    {
        title: "New Posts",
        value: "/posts"
    }
]
</script>
