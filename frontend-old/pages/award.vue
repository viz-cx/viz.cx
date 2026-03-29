<template>
  <LazyAward :extended="true" />
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})
</script>