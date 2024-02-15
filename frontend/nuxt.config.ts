import { defineNuxtConfig } from "nuxt/config"

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: true,
  css: ["~/styles/style.css"],
  site: {
    url: "https://viz.cx",
  },
  app: {
    rootId: "body",
    head: {
      title: "DAO VIZ",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "msapplication-TileColor", content: "#da532c" },
        { name: "theme-color", content: "#ffffff" },
      ],
      script: [
        {
          src: "https://unpkg.com/viz-js-lib@0.11.0/dist/viz.min.js",
          type: "text/javascript",
          async: false,
          defer: true,
          crossorigin: "anonymous",
          integrity:
            "sha384-mvWwNvp/W1KRdoZYZXfLKAjSyFgMhWWhyiQ+Th0YXC117s1f9uFNTZMxkDoXhnoj",
        },
      ],
      link: [
        {
          rel: "apple-touch-icon",
          sizes: "180x180",
          href: "/apple-touch-icon.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "32x32",
          href: "/favicon-32x32.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "16x16",
          href: "/favicon-16x16.png",
        },
        {
          rel: "manifest",
          href: "/site.webmanifest",
        },
        {
          rel: "mask-icon",
          href: "/safari-pinned-tab.svg",
          color: "#5bbad5",
        },
      ],
    },
  },
  vite: {
    define: {
      "process.env.DEBUG": false,
    },
  },
  build: {
    transpile: ["vuetify"],
  },
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.API_BASE_URL || "http://localhost:8000",
    },
  },
  routeRules: {
    "/": { prerender: true },
    "/login": { ssr: false },
  },
  modules: ["@nuxtjs/robots", "@nuxtjs/sitemap"], // sitemap should be in the end,
  sitemap: {
    sources: [
      (process.env.API_BASE_URL || "http://localhost:8000") + "/sitemap/posts",
    ],
    exclude: ["/login", "/logout", "/new"],
    sitemaps: false,
  },
})
