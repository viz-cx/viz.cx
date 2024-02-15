<template>
    <Head>
        <Title>{{ title }}</Title>
    </Head>
    <div>
        <PostList tab="popular" />
    </div>
</template>

<script setup lang="ts">
const title = 'Top posts'
</script>
