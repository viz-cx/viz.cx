export default defineNuxtPlugin((_) => {
  let viz = require("viz-js-lib")
  viz.config.set("websocket", "wss://node.viz.cx/wss")
  return {
    provide: {
      viz: viz
    }
  }
})
