<template>
    <v-textarea counter auto-grow variant="outlined" autocomplete="on" label="New post" v-model="text"
        @click="checkAuth()"></v-textarea>
    <v-btn :loading="loading" type="submit" color="success" class="mt-4" block text="Submit" @click="send()"></v-btn>
</template>

<script setup lang="ts">
const emits = defineEmits(['success'])
const loading = ref(false)
const text = ref("")

function checkAuth() {
    if (!isAuthenticated()) {
        navigateTo('/login')
        return false
    }
    return true
}

async function send() {
    if (!checkAuth()) { return }
    loading.value = true
    const login = useCookie('login').value ?? ""
    const wif = useCookie('regular').value ?? ""
    await sendVoicePost(login, wif, text.value, undefined, undefined)
        .then(success => {
            console.log(success)
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
