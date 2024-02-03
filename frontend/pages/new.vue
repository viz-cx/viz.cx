<template>
    <div v-if="loading">
        <Spinner />
    </div>
    <div v-else class="new-post">
        <SimpleEditor @success="newPost" show-share-link />
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    middleware: [
        'auth',
    ],
})

const loading = ref(false)

function newPost(content: any) {
    loading.value = true
    setTimeout(() => navigateTo('/#newest'), 12000) // TODO: change to listen new post from database
}
</script>

<style>
.new-post {
    max-width: 650px;
    margin: 20px auto;
}
</style>
