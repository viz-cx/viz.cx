<template>
    <div>
        Latest block:
        <v-code @click="refresh()">
            {{ pending ? "Loading..." : block }}
        </v-code>
    </div>
</template>

<script setup>
const { pending, refresh, data: block } = await useApiLazyFetch("/latest_block")
</script>
