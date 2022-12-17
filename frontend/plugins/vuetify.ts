import { createVuetify } from "vuetify"
import * as components from "vuetify/components"
import * as directives from "vuetify/directives"

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    locale: {
      locale: "ru",
      fallback: "en",
    },
    ssr: true,
    components,
    directives,
  })

  nuxtApp.vueApp.use(vuetify)
})
