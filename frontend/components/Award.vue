<template>
    <div class="pt-6 text-center" v-if="login">
        <input v-show="extended" variant="underlined" v-model="receiver" label="Receiver" :rules=[loginValidation]
            :required="true" />
        <div class="wrapper">
            <input v-model="energy" :min="min" :max="max" step="0.1" class="slider" type="range" />
            <div>{{ negative ? "-" : '' }}{{ energy }}% (~{{ reward.toFixed(reward > 0.01 || reward
                === 0 ? 2 : 3) }} viz)</div>
            <button class='award-button' :disabled="isSendDisabled(receiver)" :color="negative ? 'red' : 'blue'"
                :loading="loading" @click="award()">Award</button>
        </div>
        <input v-show="extended" variant="underlined" v-model="memo" label="Memo" required />
        <div class="text-red" v-show="errorMessage">{{ errorMessage }}</div>
    </div>
</template>

<script setup lang="ts">
if (!process.client) { console.error('Award only for client') }
console.log('<Award /> component rendered')
const emits = defineEmits(['success', 'close'])
const props = defineProps({
    extended: Boolean,
    receiver: String,
    memo: String,
    negative: Boolean
})
const receiver = ref(props.receiver)
const memo = ref(props.memo)
let lastVoteTime: number = 0
let currentEnergy: number = 0

let login = useCookie('login').value
let account: Ref<any> = ref()
if (login) {
    account = useState('account_' + login)
    if (!account.value) {
        account.value = await getAccount(login)
    }
    if (account.value) {
        lastVoteTime = Date.parse(account.value.last_vote_time)
        currentEnergy = calculateCurrentEnergy(lastVoteTime, account.value.energy)
    }
}

const dgp: Ref<any> = useState('dgp')
if (!dgp.value) {
    dgp.value = await getDgp()
}

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

const isSendDisabled = (receiver: string | undefined): boolean => {
    return !receiver || loginValidation(receiver) !== true
        || !energy || energy.value === 0 || reward.value < 0.01
}

const calculateReward = (energy: number): number => {
    if (!account.value || !dgp.value) { return 0 }
    const effectiveShares = parseFloat(account.value['vesting_shares']) - parseFloat(account.value['delegated_vesting_shares']) + parseFloat(account.value['received_vesting_shares'])
    const voteShares = effectiveShares * energy * 10000
    const totalRewardShares = parseInt(dgp.value['total_reward_shares']) + voteShares
    const totalRewardFund = parseInt(dgp.value['total_reward_fund']) * 1000
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

async function award() {
    loading.value = true
    errorMessage.value = ""
    let wif = useCookie('regular').value ?? ""
    try {
        let recipient: string = receiver?.value ?? ""
        let result = await makeAward(wif, login ?? "", recipient, energy.value * 100, 0, memo?.value ?? "", [])
        console.log(result)
        energy.value = 0
        const isNegative = recipient === 'cx.id'
        emits('success', reward.value, isNegative)
        emits('close')
    } catch (err: any) {
        errorMessage.value = err.message
    }
    loading.value = false
}
</script>

<style>
.award-button {
    margin: 12px;
    width: 85%;
}

.slider {
    margin: 12px;
    width: 200px;
}

.wrapper {
    text-align: center;
}
</style>
