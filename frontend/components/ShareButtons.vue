<template>
    <ul id="comments" class="right">
        <li>
            <nuxt-link :href="`https://t.me/share/url?url=${link}`" rel="nofollow" target="_blank">
                tg
            </nuxt-link>
        </li>
        <li>
            <nuxt-link :href="`http://vk.com/share.php?url=${link}`" rel="nofollow" target="_blank">
                vk
            </nuxt-link>
        </li>
        <li>
            <nuxt-link :href="`https://x.com/share?url=${link}`" rel="nofollow" target="_blank">
                x
            </nuxt-link>
        </li>
        <li>
            <nuxt-link :href="`http://www.facebook.com/sharer.php?u=${link}`" rel="nofollow" target="_blank">
                fb
            </nuxt-link>
        </li>
        <li>
            <nuxt-link :href="`mailto:?Body=${link}`" rel="nofollow" target="_blank">
                mail
            </nuxt-link>
        </li>
    </ul>
</template>

<script setup lang="ts">
defineProps({
    link: String,
})
</script>
