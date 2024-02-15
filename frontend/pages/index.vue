<template>
  <article>
    <section>
      <h2>Launched more than {{ getFullYearsFromLaunched() }} years ago</h2>
      <p>
        VIZ blockchain was launched in <a target="_blank" href="https://info.viz.plus/explorer/block/1/">September
          2018</a>.
      </p>

      <h2>Usage</h2>
      <p>
        VIZ blockchain processed {{ ops ? ops.toLocaleString() : 'many' }} operations in {{
          block ? block.toLocaleString() : 'many' }} blocks.
      </p>

      <h2>Libraries</h2>
      <p>
        VIZ has libraries for <a target="_blank" href="https://github.com/VIZ-Blockchain/viz-js-lib">JavaScript</a>,
        <a target="_blank" href="https://github.com/VIZ-Blockchain/viz-php-lib">PHP</a>, <a target="_blank"
          href="https://github.com/VIZ-Blockchain/viz-python-lib">Python</a>, <a target="_blank"
          href="https://github.com/VIZ-Blockchain/viz-go-lib">Go</a>, <a target="_blank"
          href="https://github.com/VIZ-Blockchain/viz-swift-lib">Swift</a>, <a target="_blank"
          href="https://github.com/VizTower/viz-transaction">Dart</a>, <a target="_blank"
          href="https://github.com/lososeg/Graphene.Viz">C#</a> and so on.
      </p>
    </section>
  </article>
</template>

<script setup lang="ts">
function getFullYearsFromLaunched() {
  let ageDifMs = Date.now() - Date.parse("2018-09-29T10:23:27.000Z")
  let ageDate = new Date(ageDifMs)
  return Math.abs(ageDate.getUTCFullYear() - 1970)
}

let needsUpdate = ref(0)
if (process.client) {
  setInterval(() => needsUpdate.value++, 3000)
}


const config = useRuntimeConfig()
const { data: ops } = await useAsyncData("/count_ops/all",
  () => $fetch("/count_ops/all", {
    baseURL: config.public.apiBaseUrl
  }), {
  transform: (data: any) => {
    return data['operations']
  }, watch: [needsUpdate]
})
const { data: block } = await useAsyncData("/blocks/latest",
  () => $fetch("/blocks/latest", {
    baseURL: config.public.apiBaseUrl
  }), {
  transform: (data: any) => {
    return data['_id']
  }, watch: [needsUpdate]
})

</script>