<template>
    <div>
        <div v-if="pending">
            Loading...
        </div>
        <div v-else>
            <h1>{{ data['t'] }}</h1>
            {{ data['m'] }}
        </div>
    </div>
</template>

<script setup lang="ts">
const route = useRoute()
const config = useRuntimeConfig()
const { pending, data } = await useAsyncData("/blocks",
    async () => $fetch(config.public.apiBaseUrl + "/blocks/" + route.params.block),
    {
        transform: (data: any) => {
            return JSON.parse(data['block']
                .filter((trx: any) => {
                    return trx["op"][0] === 'custom'
                        && trx["op"][1]["required_regular_auths"][0] === route.params.user
                })[0]["op"][1]['json'])['d']
        }
    },
)
</script>
