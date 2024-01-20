import { createVuetify } from "vuetify"
import * as components from "vuetify/components"
import * as directives from "vuetify/directives"

// https://codybontecou.com/how-to-use-vuetify-with-nuxt-3.html
export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    ssr: true,
    components,
    directives,
    theme: {
      themes: {
        light: {
          colors: {
            linkColor: "#0000EE",
          },
        },
        dark: {
          colors: {
            linkColor: "#FFFFFF",
          },
        },
      },
    },
  })

  nuxtApp.vueApp.use(vuetify)
})
