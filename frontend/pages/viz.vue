<template>
    <div>
        Account:
        <v-code>
            {{ account }}
        </v-code>
    </div>
</template>

<script setup>
function getAccount(name) {
    return new Promise(function (resolve, reject) {
        const { $viz } = useNuxtApp()
        $viz.api.getAccounts([name], function (err, response) {
            if (err) {
                reject(err)
                return
            }
            resolve(response)
        })
    })
}

const account = await getAccount('inov8')
</script>
