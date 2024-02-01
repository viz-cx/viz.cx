<template>
    <v-row no-gutters class="mr-4">
        <v-textarea class='textarea' rows="1" auto-grow :autofocus="props.isReply" hide-details variant="underlined"
            autocomplete="on" :label="`Add ${props.isReply ? 'reply' : 'comment'}`" v-model="text"
            @click="checkAuth()"></v-textarea>
        <v-btn :loading="loading" class="text-none" variant="flat" color="green-darken-2" @click.stop="submit"
            type="button">
            {{ props.isReply ? 'Reply' : 'Comment' }}
        </v-btn>
    </v-row>
</template>

<script setup lang="ts">
const loading = ref(false)
const text = ref('')
const props = defineProps({
    isReply: Boolean,
    reply: String,
    isFake: Boolean
})
const emits = defineEmits(['success'])

function checkAuth() {
    if (!isAuthenticated()) {
        navigateTo('/login')
        return false
    }
    return true
}

async function submit() {
    if (!checkAuth()) { return }
    if (text.value.length < 20) {
        alert('Too small text to post')
        return
    }
    loading.value = true
    const login = useCookie('login').value ?? ""
    const wif = useCookie('regular').value ?? ""
    await sendVoicePost(login, wif, text.value, undefined, undefined, props.reply)
        .then(result => {
            console.log(result)
            emits('success', text.value)
            text.value = ""
            loading.value = false
        }, failure => {
            alert(failure)
            console.log(failure)
            loading.value = false
        })
}
</script>

<style>
.v-textarea .v-field--active textarea {
    font-size: 15px;
}
</style>
