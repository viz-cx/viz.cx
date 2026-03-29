import { createVuetify } from "vuetify"
import * as components from "vuetify/components"
import * as directives from "vuetify/directives"
import * as colors from "vuetify/util/colors"

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
            linkColor: colors.grey.darken4,
          },
        },
        dark: {
          colors: {
            linkColor: colors.grey.lighten5,
          },
        },
      },
    },
  })

  nuxtApp.vueApp.use(vuetify)
})
