declare global {
  interface Window {
    viz: any
  }
}

function getViz() {
  if (typeof window === "undefined") return null
  return window.viz || null
}

export function getDgp(): Promise<any> {
  return new Promise((resolve, reject) => {
    const viz = getViz()
    if (!viz) return reject(new Error("viz not loaded"))
    viz.api.getDynamicGlobalProperties((err: any, dgp: any) => {
      if (err) return reject(err)
      resolve(dgp)
    })
  })
}

export function calculateCurrentEnergy(lastVoteTime: number, energy: number): number {
  const deltaTime =
    (new Date().getTime() - lastVoteTime + new Date().getTimezoneOffset() * 60000) / 1000
  const regenerationTime = 24 * 5 * 60 * 60
  const calculatedEnergy = energy + (deltaTime * 10000) / regenerationTime
  return Math.min(10000, calculatedEnergy)
}

export function getAccount(name: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const viz = getViz()
    if (!viz) return reject(new Error("viz not loaded"))
    viz.api.getAccount(name, "V", (err: any, response: any) => {
      if (err) return reject(err)
      resolve(response)
    })
  })
}

export function findAccountsByKey(key: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const viz = getViz()
    if (!viz) return reject(new Error("viz not loaded"))
    viz.api.getKeyReferences([key], (err: any, response: any) => {
      if (err) return reject(err)
      resolve(response[0])
    })
  })
}

export function makeAward(
  wif: string,
  initiator: string,
  receiver: string,
  energy: number,
  custom_sequence = 0,
  memo = "",
  beneficiaries: any[] = []
): Promise<any> {
  return new Promise((resolve, reject) => {
    const viz = getViz()
    if (!viz) return reject(new Error("viz not loaded"))
    viz.broadcast.award(
      wif,
      initiator,
      receiver,
      energy,
      custom_sequence,
      memo,
      beneficiaries,
      (err: any, response: any) => {
        if (err) return reject(err)
        resolve(response)
      }
    )
  })
}

export function wifToPublic(wif: string): string {
  const viz = getViz()
  if (!viz) throw new Error("viz not loaded")
  return viz.auth.wifToPublic(wif)
}

export function wifIsValid(wif: string): boolean {
  const viz = getViz()
  if (!viz) return false
  return viz.auth.isWif(wif)
}

export function initViz() {
  const viz = getViz()
  if (viz) {
    viz.config.set("websocket", "https://node.viz.cx/")
  }
}
