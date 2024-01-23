<template>
    <Head>
        <Title>Posts about #{{ route.params.tag }}</Title>
    </Head>
    <div>
        <h1>#{{ route.params.tag }}</h1>
        Tags not implemented yet.
    </div>
</template>

<script setup lang="ts">
const route = useRoute()
</script>
