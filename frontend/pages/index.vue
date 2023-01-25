<template>
  <v-timeline align="start">
    <v-timeline-item>
      <template v-slot:opposite>
        A long time ago in a galaxy far, far away....
      </template>
      <div>
        <div class="text-h6">Launched more than {{ getFullYearsFromLaunched() }} years ago</div>
        <p>
          VIZ blockchain was launched in <a target="_blank" href="https://info.viz.plus/explorer/block/1/">September
            2018</a>.
        </p>
      </div>
    </v-timeline-item>

    <v-timeline-item>
      <template v-slot:opposite>
        Support all popular languages
      </template>
      <div>
        <div class="text-h6">Libraries</div>
        <p>
          VIZ has libraries for <a target="_blank" href="https://github.com/VIZ-Blockchain/viz-js-lib">JavaScript</a>,
          <a target="_blank" href="https://github.com/VIZ-Blockchain/viz-php-lib">PHP</a>, <a target="_blank"
            href="https://github.com/VIZ-Blockchain/viz-python-lib">Python</a>, <a target="_blank"
            href="https://github.com/VIZ-Blockchain/viz-go-lib">Go</a>, <a target="_blank"
            href="https://github.com/VIZ-Blockchain/viz-swift-lib">Swift</a>, <a target="_blank"
            href="https://github.com/VizTower/viz-transaction">Dart</a>, <a target="_blank"
            href="https://github.com/lososeg/Graphene.Viz">C#</a> and so on.
        </p>
      </div>
    </v-timeline-item>

    <v-timeline-item>
      <template v-slot:opposite>
        Daily usage by people
      </template>
      <div>
        <div class="text-h6">Usage</div>
        <p>
          VIZ blockchain processed {{ pending_ops? 'many': ops.toLocaleString() }} operations in {{
  pending_block? 'many': block.toLocaleString()
          }} blocks.
        </p>
      </div>
    </v-timeline-item>
  </v-timeline>
</template>

<script setup lang="ts">
function getFullYearsFromLaunched() {
  let ageDifMs = Date.now() - Date.parse("2018-09-29T10:23:27.000Z")
  let ageDate = new Date(ageDifMs)
  return Math.abs(ageDate.getUTCFullYear() - 1970)
}

const config = useRuntimeConfig()
const { pending: pending_ops, data: ops } = await useAsyncData("/count_ops/all",
  () => $fetch("/count_ops/all", {
    baseURL: config.public.apiBaseUrl
  }), {
    transform: (data: any) => {
      return data['operations']
    }
  }
)
const { pending: pending_block, data: block } = await useAsyncData("/blocks/latest",
  () => $fetch("/blocks/latest", {
    baseURL: config.public.apiBaseUrl
  }), {
    transform: (data: any) => {
      return data['_id']
    }
  }
)

</script>