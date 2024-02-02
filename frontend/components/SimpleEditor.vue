<template>
    <v-textarea counter auto-grow variant="outlined" autocomplete="on" label="New post" v-model="text"
        @click="checkAuth()"></v-textarea>
    <v-text-field v-if="props.showShareLink" density="compact" variant="outlined" v-model="link"
        placeholder="Share link (optional)" :rules="[urlRule]"></v-text-field>
    <!-- <v-combobox clearable chips multiple label="Beneficiaries" variant="underlined"></v-combobox> -->
    <v-btn :loading="loading" type="submit" color="success" class="mt-4" block text="Submit" @click="send()"
        :disabled="link !== undefined && urlRule(link) !== true"></v-btn>
</template>

<script setup lang="ts">
const emits = defineEmits(['success'])
const props = defineProps({
    showShareLink: Boolean,
    reply: String
})
const loading = ref(false)
const text: Ref<string> = useState("simple-editor-text", () => "")
const link: Ref<string | undefined> = ref(undefined)

function checkAuth() {
    if (!isAuthenticated()) {
        navigateTo('/login')
        return false
    }
    return true
}

async function send() {
    if (!checkAuth()) { return }
    if (text.value.length < 20) {
        alert('Too small text to post')
        return
    }
    loading.value = true
    const login = useCookie('login').value ?? ""
    const wif = useCookie('regular').value ?? ""
    await sendVoicePost(login, wif, text.value, link.value, undefined, props.reply)
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

const urlRule = (value: string): boolean | string => {
    if (value) {
        return isURL(value) || "URL is not valid"
    }
    return true
}

const showUnsavedChanges = (): boolean => text.value.length > 20

const unsavedChangesWarning = "You have unsaved changes. Are you sure you wish to leave?"

const confirmLeaving = (event: any) => {
    if (showUnsavedChanges()) {
        event.returnValue = unsavedChangesWarning
        return unsavedChangesWarning
    }
}

onBeforeMount(() => {
    window.onbeforeunload = confirmLeaving
})

onUnmounted(() => {
    window.onbeforeunload = null
})

onBeforeRouteLeave((to, from, next) => {
    if (showUnsavedChanges()) {
        const answer = window.confirm(unsavedChangesWarning)
        if (!answer) return false // return false cancel the route change
    }
    next()
})
</script>
