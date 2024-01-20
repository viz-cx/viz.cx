<template>
    <v-app :theme="theme">
        <div id="newest"></div>
        <div id="popular"></div>
        <div id="replies"></div>
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

        <v-app-bar title="VIZ" style="z-index: 1000;">
            <v-btn icon="mdi-plus-box-outline" to="/new" />
            <v-btn :prepend-icon="theme === 'light' ? 'mdi-weather-sunny' : 'mdi-weather-night'"
                @click="changeTheme"></v-btn>
            <v-app-bar-nav-icon variant="text" @click.stop="showMenu = !showMenu"></v-app-bar-nav-icon>
        </v-app-bar>

        <v-main>
            <v-container class="content">
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
        title: "Landing page",
        value: "/landing"
    }
]

if (process.client) {
    if (login) {
        let account = await getAccount(String(login))
        useState('account_' + login).value = account
    }
    useState('dgp').value = await getDgp()
}

</script>

<style>
.content {
    max-width: 650px;
    margin: 20px auto;
    padding: 0 10px;
}

.dark {
    --popper-theme-background-color: #333;
    --popper-theme-background-color-hover: #333;
    /* --popper-theme-text-color: #eeeeee; */
    --popper-theme-border-width: 0px;
    --popper-theme-border-radius: 6px;
    --popper-theme-padding: 0px;
    --popper-theme-box-shadow: 0 6px 30px -6px rgba(0, 0, 0, 0.25);
}

.light {
    --popper-theme-background-color: #ffffff;
    --popper-theme-background-color-hover: #ffffff;
    --popper-theme-text-color: #333333;
    --popper-theme-border-width: 1px;
    --popper-theme-border-style: solid;
    --popper-theme-border-color: #eeeeee;
    --popper-theme-border-radius: 6px;
    --popper-theme-padding: 0px;
    --popper-theme-box-shadow: 0 6px 30px -6px rgba(0, 0, 0, 0.25);
}
</style>
