<template>
    <div class="d-flex align-center justify-center" style="height: 100vh">
        <v-sheet width="530" class="mx-auto">
            <v-form fast-fail @submit.prevent="login">

                <v-text-field variant="underlined" v-model="regularKey" label="Private Regular Key" placeholder="5..."
                    :error-messages="errors.key" :rules="[rules.keyValidation]" clearable></v-text-field>

                <v-text-field variant="underlined" v-model="user" label="Account" :error-messages="errors.user"
                    clearable></v-text-field>

                <v-btn :disabled="!regularKey" type="submit" variant="outlined" color="submit" block class="mt-2">Sign
                    in</v-btn>
            </v-form>
            <div class="mt-2">
                <p class="text-body-2">Don't have an account? <a href="#">Sign Up</a></p>
            </div>
        </v-sheet>
    </div>
</template>

<script setup lang="ts">
const { $viz } = useNuxtApp()
const router = useRouter()

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
    let publicRegularKey: string = ""
    if ($viz.auth.isWif(regularKey.value)) {
        publicRegularKey = $viz.auth.wifToPublic(regularKey.value)
    } else {
        errors.value.key = 'Looks like not a private key'
        return
    }
    let login = user.value
    if (!login) {
        let accounts = await findAccountsByKey(publicRegularKey)
        if (accounts.length > 0) {
            login = accounts[0]
        } else {
            errors.value.user = 'Account by key not found'
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
            // TODO: make cookies more secure
            useCookie('login').value = login
            useCookie('regular').value = regularKey.value

            try {
                let json = JSON.parse(account['json_metadata'])
                let avatar = json['profile']['avatar']
                if (avatar) {
                    useCookie('avatar').value = avatar
                } else {
                    useCookie('avatar').value = undefined
                }
            } catch (e) {
                console.log(e)
            }

            router.push("/")
        } else {
            errors.value.key = 'The weight of the key is not enough'
        }
    }, (err) => {
        errors.value.user = err.message
    })

}
</script>