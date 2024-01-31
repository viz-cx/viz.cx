<template>
    <v-row no-gutters class="mr-4">
        <v-textarea rows="1" auto-grow :autofocus="props.parent !== undefined" hide-details variant="underlined"
            autocomplete="on" :label="`Add ${props.parent ? 'reply' : 'comment'}`" v-model="text"></v-textarea>
        <v-btn :loading="loading" class="text-none" variant="flat" color="green-darken-2" @click.stop="submit"
            type="button">
            {{ props.parent ? 'Reply' : 'Comment' }}
        </v-btn>
    </v-row>
</template>

<script setup lang="ts">
const loading = ref(false)
const text = ref('')
const props = defineProps({
    parent: Object,
    isFake: Boolean
})

function submit() {
    loading.value = true
    console.log("SUBMIT!")
}
</script>
