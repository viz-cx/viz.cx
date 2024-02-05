<template>
    <v-container fill-height fluid>
        <div v-if="loading">
            <Spinner />
        </div>
        <v-sheet v-else>
            <v-form fast-fail @submit.prevent="login">

                <div class="wrapper">
                    <v-text-field type="text" variant="underlined" v-model="regularKey" label="Private Regular Key"
                        placeholder="5..." :error-messages="errors.key" :rules="[rules.keyValidation]"
                        clearable></v-text-field>
                    <v-btn aria-label="show login field" :icon="!showLogin ? '$expand' : '$collapse'"
                        @click.prevent="showLogin = !showLogin"></v-btn>
                </div>

                <v-text-field v-if="showLogin" variant="underlined" v-model="user" label="Account"
                    :error-messages="errors.user" clearable></v-text-field>

                <v-btn :disabled="!regularKey || rules.keyValidation(regularKey) !== true" type="submit" variant="outlined"
                    color="submit" block class="mt-2">Sign in</v-btn>
            </v-form>
            <div class="mt-2">
                <p class="text-body-2">Don't have an account? <a href="http://reg.readdle.me/?set_lang=en"
                        target="_blank">Sign Up</a></p>
            </div>
        </v-sheet>
    </v-container>
</template>

<script setup lang="ts">
import type { CookieOptions } from '#app/composables/cookie'

const { $viz } = useNuxtApp()

let loading = ref(false)
let showLogin = ref(false)
let user = ref("")
let regularKey = ref("")

const rules = {
    keyValidation: (value: string) => (!!value && value.startsWith('5')) || 'Private key should starts with 5',
}
let errors: Ref<{
    user: string,
    key: string
}> = ref({ user: "", key: "" })

async function login() {
    loading.value = true
    let publicRegularKey: string = ""
    if ($viz.auth.isWif(regularKey.value)) {
        publicRegularKey = $viz.auth.wifToPublic(regularKey.value)
    } else {
        errors.value.key = 'Looks like not a private key'
        loading.value = false
        return
    }
    let login = user.value
    if (!login) {
        let accounts = await findAccountsByKey(publicRegularKey)
        if (accounts.length > 0) {
            login = accounts[0]
        } else {
            errors.value.user = 'Account by key not found'
            loading.value = false
            return
        }
    }
    getAccount(login).then((account) => {
        errors.value = { user: "", key: "" }
        let regular_authority = account.regular_authority
        let key_weight = 0
        for (let i in regular_authority.key_auths) {
            if (regular_authority.key_auths[i][0] == publicRegularKey) {
                key_weight += regular_authority.key_auths[i][1]
            }
        }
        if (key_weight >= regular_authority.weight_threshold, key_weight >= regular_authority.weight_threshold) {
            const maxAge = 60 * 60 * 24 * 365 * 3
            let cookieSettings: CookieOptions & { readonly?: false | undefined } = { maxAge: maxAge }
            if (location.origin === 'https:') {
                cookieSettings.secure = true
                cookieSettings.sameSite = 'strict'
            }
            useCookie('login', cookieSettings).value = login
            useCookie('regular', cookieSettings).value = regularKey.value

            let avatar: string | undefined = undefined
            try {
                let json = JSON.parse(account['json_metadata'])
                avatar = json['profile']['avatar']
            } catch (e) {
                console.log(e)
            }
            useCookie('avatar', cookieSettings).value = avatar

            useState('account_' + login).value = account
            navigateTo({ path: '/' })
        } else {
            errors.value.key = 'The weight of the key is not enough'
            loading.value = false
        }
    }, (err) => {
        errors.value.user = err.message
        loading.value = false
    })
}
</script>

<style>
.wrapper {
    display: flex;
}
</style>