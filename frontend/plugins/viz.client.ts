export default defineNuxtPlugin((_) => {
  // @ts-ignore
  viz.config.set("websocket", "wss://node.viz.cx/wss")
  return {
    provide: {
      // @ts-ignore
      viz: viz
    }
  }
})
