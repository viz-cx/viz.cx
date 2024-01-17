export function changeNode() {
  const { $viz } = useNuxtApp()
  let nodes = [
    "https://node.viz.cx/",
    "https://viz.lexai.host/",
    "https://api.viz.world/",
  ]
  const oldNode = $viz.config.get("websocket") ?? ""
  nodes = nodes.filter((e) => e !== oldNode)
  const node = nodes[Math.floor(Math.random() * nodes.length)]
  console.log("Change public node from %s to %s", oldNode, node)
  $viz.config.set("websocket", node)
}

export function getDgp(): Promise<any> {
  return new Promise((resolve, reject) => {
    const { $viz } = useNuxtApp()
    $viz.api.getDynamicGlobalProperties(function (err: any, dgp: any) {
      if (err) {
        reject(err)
        return
      }
      resolve(dgp)
    })
  })
}

export function calculateCurrentEnergy(
  lastVoteTime: number,
  energy: number
): number {
  let deltaTime =
    (new Date().getTime() -
      lastVoteTime +
      new Date().getTimezoneOffset() * 60000) /
    1000
  let regenerationTime = 24 * 5 * 60 * 60
  let calculatedEnergy = energy + (deltaTime * 10000) / regenerationTime
  let minEnergy = 10000
  if (minEnergy > calculatedEnergy) {
    minEnergy = calculatedEnergy
  }
  return minEnergy
}

export async function getAccount(name: string): Promise<any> {
  const custom_protocol_id: string = "V"
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
  energy: number,
  custom_sequence: number = 0,
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
      function (err: any, response: any) {
        useState(`account.${initiator}`).value = undefined // reset account cache
        if (err) {
          reject(err)
          return
        }
        resolve(response)
      }
    )
  })
}

export async function sendVoicePost(
  login: string,
  wif: string,
  text: string,
  link: string | undefined,
  image: string | undefined
): Promise<any> {
  return new Promise((resolve, reject) => {
    const { $viz } = useNuxtApp()
    getVIZAccount(login).then(
      (account) => {
        let previous = parseInt(account.custom_sequence_block_num)
        let json: any = {}
        if (previous > 0) {
          json.p = previous
        }
        let data: any = {}
        data.t = text
        if (link && isURL(link)) {
          data.s = link
        }
        if (image) {
          data.i = image
        }
        json.d = data
        $viz.broadcast.custom(
          wif,
          [],
          [login],
          "V",
          JSON.stringify(json),
          function (err: any, response: any) {
            if (err) {
              reject(err)
              return
            }
            resolve(response)
          }
        )
      },
      (rejected) => reject(rejected)
    )
  })
}
