export async function getAccount(name: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const { $viz } = useNuxtApp()
    $viz.api.getAccounts([name], (err: any, response: any) => {
      if (err) {
        reject(err)
        return
      }
      if (response.length > 0) {
        resolve(response[0])
      } else {
        reject(new Error(`Account ${name} not found in VIZ blockchain.`))
      }
    })
  })
}
