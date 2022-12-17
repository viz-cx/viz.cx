import viz from "viz-js-lib"

export default defineNuxtPlugin((_) => {
  viz.config.set("websocket", "wss://node.viz.cx/wss")
  return {
    provide: {
      viz: viz
    }
  }
})
