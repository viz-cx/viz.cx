import viz from "viz-js-lib"

export default defineNuxtPlugin((_) => {
  viz.config.set("websocket", "https://node.viz.cx/")
  return {
    provide: {
      viz: viz
    }
  }
})
