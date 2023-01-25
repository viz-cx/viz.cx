<template>
    <v-app :theme="theme">

        <v-navigation-drawer v-model="showMenu" location="end" temporary>
            <v-list dense nav>
                <v-list-item lines="two" prepend-avatar="https://randomuser.me/api/portraits/women/81.jpg"
                    title="Jane Smith" subtitle="Logged in"></v-list-item>
                <v-divider></v-divider>
                <v-list-item v-for="item in items" :key="item.title" :to="item.value">
                    <v-list-item-title>{{ item.title }}</v-list-item-title>
                </v-list-item>
            </v-list>
        </v-navigation-drawer>

        <v-app-bar title="VIZ">
            <v-spacer></v-spacer>

            <!-- <v-btn icon="mdi-wizard-hat"/> -->
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
</script>

<script lang="ts">
export default {
    data: () => ({
        showMenu: false,
        group: null,
        items: [
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
            }
        ],
    }),
    watch: {
        group() {
            this.showMenu = false
        },
    },
}
</script>
