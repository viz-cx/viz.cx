<template>
    <div class="new-post">
        <v-container fluid>
            <v-textarea auto-grow counter variant="outlined" autocomplete="on" label="New post" v-model="text"></v-textarea>
            <v-text-field density="compact" variant="outlined" v-model="link" placeholder="Share link (optional)"
                :rules="[urlRule]"></v-text-field>
            <!-- <v-file-input prepend-icon="mdi-camera" density="compact" show-size clearable label="Image (optional)"
                accept="image/*"></v-file-input> -->
            <!-- <v-combobox clearable chips multiple label="Beneficiaries" variant="underlined"></v-combobox> -->
            <v-btn :loading="loading" type="submit" color="success" class="mt-4" block text="Submit"
                @click="send()"></v-btn>
        </v-container>
    </div>
</template>

<script setup lang="ts">
import { isURL } from '~/composables/links'

definePageMeta({
    middleware: [
        'auth',
    ],
})

let link = ref("")
let image = ref("")
let loading = ref(false)
let text = ref("")

let urlRule = (value: string): boolean | string => {
    if (value) {
        return isURL(value) || "URL is not valid"
    }
    return true
}

async function send() {
    loading.value = true
    let login = useCookie('login').value ?? ""
    let wif = useCookie('regular').value ?? ""
    await sendVoicePost(login, wif, text.value, link.value, image.value, undefined)
        .then(sucess => {
            console.log(sucess)
            text.value = ""
            setTimeout(() => navigateTo('/posts'), 20000) // TODO: change to listen new post from database
        }, failure => {
            alert(failure)
            console.log(failure)
            loading.value = false
        })
}
</script>

<style>
.new-post {
    max-width: 650px;
    margin: 20px auto;
}
</style>
