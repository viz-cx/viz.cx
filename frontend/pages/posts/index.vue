<template>
    <Head>
        <Title>{{ title }}</Title>
    </Head>
    <div>
        <v-card variant="outlined">
            <v-toolbar color="primary">
                <v-toolbar-title>{{ title }}</v-toolbar-title>
                <template v-slot:extension>
                    <v-tabs v-model="tab" align-tabs="title">
                        <v-tab v-for="item in tabs" :key="item" :value="item">
                            {{ item }}
                        </v-tab>
                    </v-tabs>
                </template>
            </v-toolbar>
        </v-card>
        <br />
        <PostList v-for="value in tabs" :tab="value" v-show="value === tab" />
    </div>
</template>

<script setup lang="ts">
const title = 'Voice Protocol Posts'
const tab = ref<string | null>(null)
const tabs = ['newest', 'popular']
</script>