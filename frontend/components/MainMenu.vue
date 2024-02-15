<template>
    <nav>
        <ul>
            <li>
                <nuxt-link href="/" title="main page" accesskey="h"><b>{{ siteName }}</b></nuxt-link>
            </li>
            <li class="unicode">
                <span v-if="route.name == 'top'">∧</span>
                <nuxt-link v-else href="/top" title="top articles" accesskey="1"><span>∧</span></nuxt-link>
            </li>
            <li class="unicode">
                <span v-if="route.name == 'mid'">Ξ</span>
                <nuxt-link v-else href="/mid" title="new articles" accesskey="2">Ξ</nuxt-link>
            </li>
            <li class="unicode">
                <span v-if="route.name == 'btm'">∨</span>
                <nuxt-link v-else href="/btm" title="bottom articles" accesskey="3">∨</nuxt-link>
            </li>
            <div class="navright">
                <li v-if="authenicated">
                    <span v-if="route.name == 'new'">+</span>
                    <nuxt-link v-else href="/new" title="new article" accesskey="n"><span>+</span></nuxt-link>
                </li>
                <!-- <li>
                        {{if eq(print "/@".username).path }}
                        @{{.username }}
                        {{if .energy }}
                        ({{ printf "%.2f".energy }}%)
                        {{ end }}
                        {{else }}
                        <a href="/@{{.username}}" title="profile settings" accesskey="l">
                            @{{.username }}
                            {{if .energy }}
                            ({{ printf "%.2f".energy }}%)
                            {{ end }}
                        </a>
                        {{ end }}
                    </li>
                    {{ else }}
                    <li>
                        {{if eq "/register".path }}
                        sign up
                        {{else }}
                        <a href="/register" title="register" accesskey="r">sign up</a>
                        {{ end }}
                    </li>
                    <li>
                        {{if eq "/login".path }}
                        sign in
                        {{else }}
                        <a href="/login" title="login" accesskey="l">sign in</a>
                        {{ end }}
                    </li>
                    <li>
                        <a href="{{.config.AboutPage}}" title="about page" accesskey="4">?</a>
                    </li>
                    {{ end }} -->
            </div>
        </ul>
    </nav>
</template>

<script lang="ts" setup>
const route = useRoute()
const siteName = 'viz.cx'
const authenicated = true
</script>