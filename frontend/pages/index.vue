<template>
  <v-timeline align="start">
    <v-timeline-item>
      <template v-slot:opposite>
        A long time ago in a galaxy far, far away....
      </template>
      <div>
        <div class="text-h6">{{ getFullYearsFromLaunched() }} years</div>
        <p>
          VIZ blockchain was launched in <a href="https://info.viz.plus/explorer/block/1/">September 2018</a>.
        </p>
      </div>
    </v-timeline-item>

    <v-timeline-item>
      <template v-slot:opposite>
        Support many languages...
      </template>
      <div>
        <div class="text-h6">Libraries</div>
        <p>
          We have libraries for <a href="https://github.com/VIZ-Blockchain/viz-js-lib">JavaScript</a>, <a href="https://github.com/VIZ-Blockchain/viz-php-lib">PHP</a>, <a href="https://github.com/VIZ-Blockchain/viz-python-lib">Python</a>, <a href="https://github.com/VIZ-Blockchain/viz-go-lib">Go</a>, <a href="https://github.com/VIZ-Blockchain/viz-swift-lib">Swift</a>, <a href="https://github.com/VIZ-Blockchain/viz-go-lib">Go</a>, <a href="https://github.com/VizTower/viz-transaction">Dart</a>, <a href="https://github.com/lososeg/Graphene.Viz">C#</a> and so on.
        </p>
      </div>
    </v-timeline-item>
  </v-timeline>
</template>

<script setup lang="ts">
function getFullYearsFromLaunched() {
  var ageDifMs = Date.now() - Date.parse("2018-09-29T10:23:27.000Z")
  var ageDate = new Date(ageDifMs)
  return Math.abs(ageDate.getUTCFullYear() - 1970)
}
</script>