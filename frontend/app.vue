<template>
  <div class="min-h-screen w-screen pt-24">
    <div class="max-w-7xl mx-auto">
      <h1>{{ runtimeConfig.mainTitle }}</h1>
    </div>
  </div>
</template>

<script lang="ts" setup>
const runtimeConfig = useRuntimeConfig()
</script>