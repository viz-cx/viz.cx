export async function getAccount(name: string, custom_protocol_id: string = 'V'): Promise<any> {
  return new Promise((resolve, reject) => {
    const { $viz } = useNuxtApp()
    $viz.api.getAccount(name, custom_protocol_id, (err: any, response: any) => {
      if (err) {
        reject(err)
        return
      }
      resolve(response)
    })
  })
}
