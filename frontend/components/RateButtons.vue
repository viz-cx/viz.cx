<template>
    <div class="rate-buttons-wrapper">
        <ConfettiExplosion v-if="showConfetti" :duration="7000" :particleSize="20" :particleCount="200" />
        <Popper :class="theme" arrow placement="top">
            <v-btn :size="size" variant="text" icon="mdi-thumb-up" color="blue-accent-2" @click="awardClicked()"></v-btn>
            <template #content="{ close, isOpen }">
                <LazyAward v-if="isOpen" :extended="false" :receiver="props.author" :memo="props.memo" :negative="false"
                    @success="awardSuccess" @close="close">
                </LazyAward>
            </template>
        </Popper>

        <div :title="(awards ?? 0) + ' award(s)'">{{ shares !== undefined ?
            shares.toFixed(2) : '???'
        }} VIZ</div>

        <Popper :class="theme" arrow placement="top">
            <v-btn :size="size" variant="text" icon="mdi-thumb-down" color="red-accent-2" @click="awardClicked()"></v-btn>
            <template #content="{ close, isOpen }">
                <LazyAward v-if="isOpen" :extended="false" receiver="cx.id" :memo="props.memo" :negative="true"
                    @success="awardSuccess" @close="close">
                </LazyAward>
            </template>
        </Popper>

    </div>
</template>

<script setup lang="ts">
import ConfettiExplosion from "vue-confetti-explosion"
import Popper from "vue3-popper"
const showConfetti = ref(false)
const theme = useState("theme", () => "light")

defineComponent({
    components: {
        Popper,
    },
})

const props = defineProps({
    author: String,
    memo: String,
    awards: Number,
    shares: Number,
    size: String
})
const awards = ref(props.awards)
const shares = ref(props.shares)
const size = props.size ?? 'medium'

function awardClicked() {
    if (!isAuthenticated()) {
        const router = useRouter()
        router.push('/login')
    }
}

const explodeConfetti = async () => {
    showConfetti.value = false
    await nextTick()
    showConfetti.value = true
}

function awardSuccess(reward: number, isNegative: boolean) {
    explodeConfetti()
    if (shares.value !== undefined) {
        if (isNegative) {
            shares.value -= reward
        } else {
            shares.value += reward
        }
    }
    if (awards.value !== undefined) {
        awards.value += 1
    }
}
</script>

<style>
.rate-buttons-wrapper {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.rate-buttons-wrapper>div {
    margin-inline: 4px;
}
</style>
