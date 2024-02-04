<template>
    <v-app :theme="theme">
        <div id="newest"></div>
        <div id="popular"></div>
        <div id="replies"></div>
        <v-navigation-drawer v-model="showMenu" location="start" temporary>
            <v-list dense nav>
                <v-list-item v-if="login" lines="two" :prepend-avatar="avatar ?? defaultAvatar" :title="login"
                    subtitle="Logged in" href="/logout"></v-list-item>
                <v-list-item v-else lines="two" href="/login" title="Log In / Sign Up"></v-list-item>
                <v-divider></v-divider>
                <v-list-item v-for="item in menuItems" :key="item.title" :to="item.value">
                    <v-list-item-title>{{ item.title }}</v-list-item-title>
                </v-list-item>
            </v-list>
        </v-navigation-drawer>

        <v-app-bar app style="z-index: 1000;">
            <v-app-bar-nav-icon variant="text" @click.stop="showMenu = !showMenu"></v-app-bar-nav-icon>
            <v-toolbar-title>VIZ.cx</v-toolbar-title>
            <v-btn aria-label="make new post" icon="mdi-plus-box-outline" to="/new" />
            <v-btn aria-label="change theme" :prepend-icon="theme === 'light' ? 'mdi-weather-sunny' : 'mdi-weather-night'"
                @click="changeTheme"></v-btn>
        </v-app-bar>

        <v-main>
            <v-container class="content">
                <slot />
            </v-container>

            <v-footer height="36" class="bg-primary mt-2">
                <v-layout class="justify-center">
                    &copy; 2018 — {{ new Date().getFullYear() }}<strong>&nbsp;&bull; VIZ.cx</strong>
                    &nbsp;&bull;&nbsp;<nuxt-link target="_blank" href="https://github.com/viz-cx/viz.cx">github</nuxt-link>
                    &nbsp;&bull;&nbsp;<nuxt-link target="_blank" href="https://t.me/viz_cx">telegram</nuxt-link>
                </v-layout>
            </v-footer>
        </v-main>
    </v-app>
</template>

<script setup lang="ts">
const cookieTheme = useCookie('theme')
const theme = useState("theme", () => cookieTheme.value ?? "light")
function changeTheme() {
    theme.value = theme.value === "light" ? "dark" : "light"
    cookieTheme.value = theme.value
}

const login = useCookie('login')
const avatar = useCookie('avatar')
const defaultAvatar = 'https://info.viz.plus/default-avatar.png'
const showMenu = ref(false)

if (process.client) {
    if (login.value) {
        let account = await getAccount(login.value)
        useState('account_' + login).value = account
    }
    useState('dgp').value = await getDgp()
}
</script>

<style>
.v-footer a {
    color: white;
}

.v-toolbar-title {
    font-size: 1.5rem !important;
}

.content {
    max-width: 768px;
}

a {
    color: rgb(var(--v-theme-linkColor));
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
