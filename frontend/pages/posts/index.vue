<template>
    <div>

        <Head>
            <Title>{{ title }}</Title>
        </Head>
        <div class="posts">
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
    </div>
</template>

<script setup lang="ts">
const title = 'Voice Protocol Posts'
const tab = ref<string | null>(null)
const tabs = ['newest', 'popular']
</script>

<style>
.text-opened {
    min-height: 70px;
}

.posts {
    max-width: 650px;
    margin: 20px auto;
    padding: 0 10px;
    color: #444;
}

.dark {
    --popper-theme-background-color: #333;
    --popper-theme-background-color-hover: #333;
    /* --popper-theme-text-color: #eeeeee; */
    --popper-theme-border-width: 0px;
    --popper-theme-border-radius: 6px;
    --popper-theme-padding: 0px;
    --popper-theme-box-shadow: 0 6px 30px -6px rgba(0, 0, 0, 0.25);
}

.light {
    --popper-theme-background-color: #ffffff;
    --popper-theme-background-color-hover: #ffffff;
    --popper-theme-text-color: #333333;
    --popper-theme-border-width: 1px;
    --popper-theme-border-style: solid;
    --popper-theme-border-color: #eeeeee;
    --popper-theme-border-radius: 6px;
    --popper-theme-padding: 0px;
    --popper-theme-box-shadow: 0 6px 30px -6px rgba(0, 0, 0, 0.25);
}
</style>
