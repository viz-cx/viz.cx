<template>
    <ConfettiExplosion v-if="showConfetti" :duration="7000" :particleSize="20" :particleCount="200" />

    <Popper :class="theme" arrow placement="top">
        <a @click.prevent="awardClicked()" accesskey="u" title="upvote" class="vote">+</a>
        <template #content="{ close, isOpen }">
            <LazyAward v-if="isOpen" :extended="false" :receiver="props.author" :memo="props.memo" :negative="false"
                @success="awardSuccess" @close="close">
            </LazyAward>
        </template>
    </Popper>

    <span :title="(awards ?? 0) + ' award(s)'">
        &nbsp;<b>{{ shares !== undefined ? shares.toFixed(2) : '???' }} VIZ</b>&nbsp;
    </span>

    <Popper :class="theme" arrow placement="top">
        <a @click.prevent="awardClicked()" accesskey="d" title="downvote" class="vote">-</a>
        <template #content="{ close, isOpen }">
            <LazyAward v-if="isOpen" :extended="false" receiver="cx.id" :memo="props.memo" :negative="true"
                @success="awardSuccess" @close="close">
            </LazyAward>
        </template>
    </Popper>
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
})
const awards = ref(props.awards)
const shares = ref(props.shares)

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
.vote {
    display: inline-block;
    position: relative;
    z-index: 1;
    padding: 1em;
    margin: -1em;
    cursor: pointer;
}
</style>
