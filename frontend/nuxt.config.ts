// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      title: "DAO VIZ",
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
      ],
      script: [],
      link: [
        {
          rel: "stylesheet",
          href: "https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css",
        },
      ],
    },
  },
  runtimeConfig: {
    public: {
      mainTitle: "DAO VIZ"
    }
  }
});
