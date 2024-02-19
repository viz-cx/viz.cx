<template>
    <header>
        <MainMenu />
    </header>
    <main>
        <slot />
    </main>
    <footer>
        <p>
            <span>
                <nuxt-link href="/about">about</nuxt-link>&nbsp;&nbsp;
            </span>
            <span>
                <nuxt-link target="_blank" href="https://github.com/viz-cx/viz.cx">github</nuxt-link>&nbsp;&nbsp;
            </span>
            <span>
                <nuxt-link target="_blank" href="https://t.me/viz_cx">telegram</nuxt-link>&nbsp;&nbsp;
            </span>
            <span>
                <nuxt-link href="/policy">privacy</nuxt-link>&nbsp;&nbsp;
            </span>
            <span>
                <nuxt-link href="/terms">terms</nuxt-link>
            </span>
        </p>
    </footer>
</template>

<script setup lang="ts">
const cookieTheme = useCookie('theme')
const theme = useState("theme", () => cookieTheme.value ?? "light")
function changeTheme() {
    theme.value = theme.value === "light" ? "dark" : "light"
    cookieTheme.value = theme.value
}

const login = useCookie('login', { readonly: true })
const avatar = useCookie('avatar', { readonly: true })

if (process.client) {
    if (login.value) {
        let account = await getAccount(login.value)
        useState('account_' + login.value).value = account
    }
    useState('dgp').value = await getDgp()
}
</script>

<style>
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
