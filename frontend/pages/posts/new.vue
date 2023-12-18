<template>
    <div class="new-post">
        <v-container fluid>
            <v-textarea auto-grow counter variant="outlined" autocomplete="on" label="New post"
                :model-value="text"></v-textarea>
            <!-- <v-file-input prepend-icon="mdi-camera" density="compact" show-size clearable label="Image (optional)"
                accept="image/*"></v-file-input> -->
            <v-btn :loading="loading" type="submit" color="success" class="mt-4" block text="Submit"></v-btn>
        </v-container>
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    middleware: [
        'auth',
    ],
})
let loading = ref(false)
let text = ref("The Woodman set to work at once, and so sharp was his axe that the tree was soon chopped nearly through.")
</script>

<style>
.new-post {
    max-width: 650px;
    margin: 40px auto;
}
</style>
