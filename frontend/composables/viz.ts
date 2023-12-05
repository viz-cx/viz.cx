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

export async function makeAward(
  wif: string,
  initiator: string,
  receiver: string,
  energy: int,
  custom_sequence: int = 0,
  memo: string = "",
  beneficiaries = []
): Promise<any> {
  return new Promise((resolve, reject) => {
    const { $viz } = useNuxtApp()
    $viz.broadcast.award(
      wif,
      initiator,
      receiver,
      energy,
      custom_sequence,
      memo,
      beneficiaries,
      function (err, response) {
        if (err) {
          reject(err)
          return
        }
        resolve(response)
      }
    )
  })
}
