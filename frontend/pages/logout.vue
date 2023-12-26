<template></template>

<script setup lang="ts">
useCookie('login').value = undefined
useCookie('regular').value = undefined
useCookie('avatar').value = undefined
const router = useRouter()
router.push('/')
</script>
