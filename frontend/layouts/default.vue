<template>
    <v-app :theme="theme">

        <v-navigation-drawer v-model="showMenu" location="end" temporary>
            <v-list dense nav>
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
  
<script setup>
const theme = useState('theme', () => 'dark')
function changeTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
}
</script>
  
<script>
export default {
    data: () => ({
        showMenu: false,
        group: null,
        items: [
            {
                title: 'Home',
                value: '/',
            },
            {
                title: 'Analytics',
                value: '/analytics',
            },
            {
                title: 'VIZ account',
                value: '/viz'
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