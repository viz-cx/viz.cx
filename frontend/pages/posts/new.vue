<template>
    New post
    <div id="editor">
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    middleware: [
        'auth',
    ],
})
</script>