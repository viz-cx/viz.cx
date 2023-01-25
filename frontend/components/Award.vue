<template>
    <v-card class="pt-8 px-3 pb-2 text-center" min-width="350">
        <v-slider color="orange" track-color="green" thumb-color="purple" v-model="slider" :max="max" :min="min"
            thumb-label="always">
        </v-slider>
        <v-btn color="green" :loading="loading" @click="loading = !loading">Award</v-btn>
    </v-card>
</template>

<script setup>
let loading = ref(false)
let min = 1
let max = 90
let slider = ref(40)
</script>
