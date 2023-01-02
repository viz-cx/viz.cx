<template>
    <div>
        <h3>TOP telegram channels</h3>
        <v-container fluid>
            <v-row align="center">
                <v-select label="By" v-model="select" :items="selects" variant="underlined"></v-select>
                <v-select label="Period" v-model="period" :items="periods" variant="underlined"></v-select>
                <v-select label="Limit" v-model="limit" :items="limits" variant="underlined"></v-select>
            </v-row>
        </v-container>
        <div v-if="pending">
            Loading...
        </div>
        <div v-else>
            <v-table fixed-header>
                <thead>
                    <tr>
                        <th class="text-left">
                            Channel
                        </th>
                        <th class="text-left">
                            {{ select }}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in resp['channels']" :key="item.channel">
                        <td>
                            <a :href="item.channel" target="_blank">{{ item.channel }}</a>
                        </td>
                        <td>{{ select === 'Shares' ? parseFloat(item.value).toFixed(3) : item.value }}</td>
                    </tr>
                </tbody>
            </v-table>
        </div>
    </div>
</template>

<script setup lang="ts">
const selects = ['Shares', 'Awards']
var select = ref('Shares')
const periods = ['Week', 'Month', 'Year', 'All']
let period = ref('All')
const limits = [10, 25, 50, 100]
let limit = ref(100)

function getDateByPeriod(period: string): Date {
    let days: number
    switch (period) {
        case "Week":
            days = 7
            break
        case "Month":
            days = 30
            break
        case "Year":
            days = 365
            break
        case "All":
            days = 3650
            break
        default:
            days = 0
            break
    }
    return new Date((new Date()).getTime() - days * 24 * 60 * 60 * 1000)
}

const config = useRuntimeConfig()
const { pending, data: resp } = await useAsyncData("top_channels",
    () => $fetch("/tg_stats/top_channels", {
        baseURL: config.public.apiBaseUrl,
        params: {
            by: select.value.toLowerCase(),
            to_date: (new Date()).toISOString(),
            from_date: getDateByPeriod(period.value).toISOString(),
            in_top: limit.value,
            to_skip: 0
        },
    }),
    {
        watch: [select, period, limit]
    }
)

</script>
