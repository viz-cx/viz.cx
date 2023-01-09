<template>
  <div>
    <h3>Telegram channels</h3>
    <v-container fluid>
      <v-row align="center">
        <v-select label="By" v-model="select" :items="selects" variant="underlined"></v-select>
        <v-select label="Period" v-model="period" :items="periods" variant="underlined"></v-select>
        <v-select label="Limit" v-model="limit" :items="limits" variant="underlined"></v-select>
      </v-row>
    </v-container>
    <div v-if="pending">Loading...</div>
    <div v-else>
      <v-table fixed-header>
        <thead>
          <tr>
            <th class="text-left">Channel</th>
            <th class="text-left">
              {{ select }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in resp" :key="item.channel">
            <td>
              <nuxt-link :href="item.channel" target="_blank">{{
                item.channel
              }}</nuxt-link>
            </td>
            <td>
              {{ select === "Shares" ? parseFloat(item.value).toFixed(3) : item.value }}
            </td>
          </tr>
        </tbody>
      </v-table>
    </div>
  </div>
</template>

<script setup lang="ts">
const selects = ["Shares", "Awards"]
let select = ref("Shares")
const periods = ["Week", "Month", "Year", "All"]
let period = ref("Week")
const limits = [10, 25, 50, 100, 1000]
let limit = ref(10)

const config = useRuntimeConfig()
const { pending, data: resp } = await useAsyncData(
  "/telegram/top_channels",
  () =>
    $fetch("/telegram/top_channels", {
      baseURL: config.public.apiBaseUrl,
      params: {
        by: select.value.toLowerCase(),
        to_date: new Date().toISOString(),
        from_date: getDateByPeriod(period.value).toISOString(),
        in_top: limit.value,
        to_skip: 0,
      },
    }),
  {
    transform: (data: any) => { return data['channels'] },
    watch: [select, period, limit],
  }
)
</script>
