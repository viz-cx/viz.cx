<template>
    <div>

        <Head>
            <Title>{{ title }}</Title>
        </Head>
        <h1>{{ title }}</h1>
        <v-container fluid>
            <v-row align="center">
                <v-select label="By" v-model="select" :items="selects" variant="underlined"></v-select>
                <v-select label="Period" v-model="period" :items="periods" variant="underlined"></v-select>
                <v-select label="Limit" v-model="limit" :items="limits" variant="underlined"></v-select>
            </v-row>
        </v-container>
        <div v-if="pending">
            <Spinner />
        </div>
        <div v-else>
            <v-table fixed-header>
                <thead>
                    <tr>
                        <th class="text-left">
                            Post
                        </th>
                        <th class="text-left">
                            {{ select }}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in resp" :key="item.post">
                        <td>
                            <nuxt-link :href="item.post" target="_blank">{{ item.post }}</nuxt-link>
                        </td>
                        <td>{{ select === 'Shares' ? parseFloat(item.value).toFixed(3) : item.value }}</td>
                    </tr>
                </tbody>
            </v-table>
        </div>
    </div>
</template>

<script setup lang="ts">
const title = 'Telegram Posts'
const route = useRoute()
const router = useRouter()
const selects = ['Shares', 'Awards']
let select = ref(route.query.by ? capitalize(route.query.by.toString()) : selects[0])
const periods = ['Week', 'Month', 'Year', 'All']
let period = ref(route.query.period ? capitalize(route.query.period.toString()) : periods[0])
const limits = [10, 25, 50, 100, 1000]
let limit = ref(route.query.limit ? route.query.limit : limits[0])

const config = useRuntimeConfig()
const { pending, data: resp } = useAsyncData("/telegram/top_posts",
    async () => $fetch("/telegram/top_posts", {
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
        transform: (data: any) => { return data['posts'] },
        watch: [select, period, limit]
    }
)

watch([select, period, limit], (newValues) => {
    router.push({
        query: {
            by: newValues[0].toLowerCase(),
            period: newValues[1].toLowerCase(),
            limit: newValues[2]
        },
    })
})
</script>
