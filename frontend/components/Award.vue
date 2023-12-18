<template>
    <!-- <v-card class="award pt-8 px-3 pb-2 text-center"> -->
    <div class="award pt-8 px-3 pb-2 text-center">
        <v-text-field v-show="extended" variant="underlined" v-model="receiver" label="Receiver" :rules=[loginValidation]
            required></v-text-field>
        <div class="wrapper">
            <ClientOnly>&nbsp;<span class="text-body-2 helper">~{{ reward.toFixed(2) }} viz</span></ClientOnly>
            <v-slider class="slider" :color="negative ? 'red-accent-4' : 'indigo-accent-4'"
                :track-color="negative ? 'red-accent-4' : 'indigo-accent-4'" thumb-color="white" v-model="energy" :max="max"
                :step="1" :min="min" thumb-label="always">
                <template v-slot:thumb-label="{ modelValue }">
                    {{ modelValue }}%
                </template>
            </v-slider>
            <v-btn :disabled="isSendDisabled(receiver)" :color="negative ? 'red-darken-1' : 'indigo-accent-4'"
                :loading="loading" @click="award()">Award</v-btn>
        </div>
        <v-text-field v-show="extended" variant="underlined" v-model="memo" label="Memo" required></v-text-field>
        <div class="text-green" v-show="successMessage">{{ successMessage }}</div>
        <div class="text-red" v-show="errorMessage">{{ errorMessage }}</div>
    </div>
    <!-- </v-card> -->
</template>

<script setup lang="ts">
const props = defineProps({
    extended: Boolean,
    receiver: String,
    memo: String,
    negative: Boolean,
})
const { receiver, memo } = toRefs(props)
let login = useCookie('login').value ?? ""
let account = await getAccount(login)
let dgp = await getDgp()
let lastVoteTime = Date.parse(account.last_vote_time)
let currentEnergy = calculateCurrentEnergy(lastVoteTime, account.energy)
let successMessage = ref("")
let errorMessage = ref("")
let loading = ref(false)
let min = 0
let max = Math.round(currentEnergy / 100)
let energy = ref(0)
let reward = ref(0.0)

watch(
    () => energy.value,
    (value) => { reward.value = calculateReward(value) }
)

const calculateReward = (energy: number): number => {
    const effectiveShares = parseFloat(account['vesting_shares']) - parseFloat(account['delegated_vesting_shares']) + parseFloat(account['received_vesting_shares'])
    const voteShares = effectiveShares * energy * 10000
    const totalRewardShares = parseInt(dgp['total_reward_shares']) + voteShares
    const totalRewardFund = parseInt(dgp['total_reward_fund']) * 1000
    const reward = totalRewardFund * voteShares / totalRewardShares
    const finalReward = reward * 0.9995 // decrease expectations to 0.005% because final value could be less
    return Math.ceil(finalReward) / 1000
}

const loginValidation = (value: string) => {
    if (value === undefined) {
        return true
    }
    if (!(/^([a-z0-9\-\.]*)$/).test(value)) {
        return 'Unexpected symbols in the recipient login'
    }
    if (value.length < 2) {
        return 'Login should consists two symbols and more'
    }
    var firstChar = value.charAt(0)
    var lastChar = value.charAt(value.length - 1)
    if (!/^([a-z])$/.test(firstChar)) {
        return 'Login must begin with a Latin symbol'
    }
    if (!/^([a-z0-9])$/.test(lastChar)) {
        return 'Login must end with a Latin symbol or a number'
    }
    return true
}

function isSendDisabled(receiver: string | undefined) {
    return !receiver || loginValidation(receiver) !== true
        || !energy || energy.value === 0 || reward.value <= 0.01
}

async function award() {
    loading.value = true
    successMessage.value = ""
    errorMessage.value = ""
    let wif = useCookie('regular').value ?? ""
    try {
        let result = await makeAward(wif, login, receiver?.value ?? "", energy.value * 100)
        console.log(result)
        successMessage.value = "Success!"
        energy.value = 0
        if (receiver) {
            receiver.value = undefined
        }
    } catch (err: any) {
        errorMessage.value = err.message
    }
    loading.value = false
}
</script>

<style>
.slider {
    width: 300px;
}

.award {
    max-width: 450px;
    /* margin: 10px auto; */
    padding: 0 10px;
    font: 18px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
}

.wrapper {
    display: flex;
    align-items: flex-start;
}

.helper {
    min-width: 90px;
    margin-top: 5px;
    white-space: nowrap;
    overflow: hidden;
}
</style>
