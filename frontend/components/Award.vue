<template>
    <v-card class="award pt-8 px-3 pb-2 text-center">
        <v-text-field variant="underlined" v-model="receiver" label="Receiver" :rules=[loginValidation]
            clearable required></v-text-field>
        <v-slider color="indigo-accent-4" track-color="indigo-accent-4" thumb-color="white" v-model="energy" :max="max" :min="min"
            thumb-label="always">
        </v-slider>
        <v-btn :disabled="isSendDisabled(receiver)" color="green-darken-1" :loading="loading" @click="award()">Award</v-btn>
        <div class="text-green" v-show="successMessage">{{ successMessage }}</div>
        <div class="text-red" v-show="errorMessage">{{ errorMessage }}</div>
    </v-card>
</template>

<script setup>
let successMessage = ref("")
let errorMessage = ref("")
let loading = ref(false)
let min = 1
let max = 99.9
let energy = ref(0)
let receiver = ref("")

const loginValidation = (value) => {
    if (value === undefined) {
        return true
    }
    if (!(/^([a-z0-9\-\.]*)$/).test(value)) {
        return 'Unexpected symbols in the recipient login'
    }
    if (value.length < 2) {
        return 'Login should consists two symbols and more'
    }
    var first_char = value.substr(0, 1)
    var last_char = value.substr(-1, 1)
    if (!/^([a-z])$/.test(first_char)) {
        return 'Login must begin with a Latin symbol'
    }
    if (!/^([a-z0-9])$/.test(last_char)) {
        return 'Login must end with a Latin symbol or a number'
    }
    return true
}

function isSendDisabled(receiver) {
    return !receiver || loginValidation(receiver) !== true
}

async function award() {
    loading = true
    successMessage.value = ""
    errorMessage.value = ""
    let custom_sequence = 0
    let beneficiaries = []
    let initiator = useCookie('login').value
    let wif = useCookie('regular').value
    try {
        let result = await makeAward(wif, initiator, receiver.value, energy.value * 100)
        console.log(result)
        successMessage.value = "Success!"
        energy.value = 0
        receiver.value = undefined
    } catch (err) {
        errorMessage.value = err.message
    }
    loading = false
}
</script>

<style>
.award {
    max-width: 450px;
    margin: 40px auto;
    padding: 0 10px;
    font: 18px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
    color: #444
}
</style>
