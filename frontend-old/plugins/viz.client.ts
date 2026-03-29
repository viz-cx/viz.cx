export default defineNuxtPlugin((_) => {
  // @ts-ignore
  viz.config.set("websocket", "https://node.viz.cx/")
  return {
    provide: {
      // @ts-ignore
      viz: viz
    }
  }
})
