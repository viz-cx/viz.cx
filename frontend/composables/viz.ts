export async function getAccount(
  name: string,
  custom_protocol_id: string = "V"
): Promise<any> {
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

export async function findAccountsByKey(key: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const { $viz } = useNuxtApp()
    $viz.api.getKeyReferences([key], function (err: any, response: any) {
      console.log(err, response)
      if (err) {
        reject(err)
        return
      }
      resolve(response[0])
    })
  })
}
