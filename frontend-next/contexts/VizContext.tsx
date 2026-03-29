"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { initViz, getDgp, getAccount } from "@/lib/viz"
import { getCookie } from "@/lib/auth"

interface VizContextType {
  ready: boolean
  dgp: any
  account: any
  refreshAccount: () => Promise<void>
}

const VizContext = createContext<VizContextType>({
  ready: false,
  dgp: null,
  account: null,
  refreshAccount: async () => {},
})

export function VizProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [dgp, setDgp] = useState<any>(null)
  const [account, setAccount] = useState<any>(null)

  async function refreshAccount() {
    const login = getCookie("login")
    if (login) {
      try {
        const acc = await getAccount(login)
        setAccount(acc)
      } catch {}
    }
  }

  useEffect(() => {
    const init = async () => {
      initViz()
      try {
        const d = await getDgp()
        setDgp(d)
      } catch {}
      await refreshAccount()
      setReady(true)
    }

    const check = setInterval(() => {
      if (typeof window !== "undefined" && window.viz) {
        clearInterval(check)
        init()
      }
    }, 100)

    return () => clearInterval(check)
  }, [])

  return (
    <VizContext.Provider value={{ ready, dgp, account, refreshAccount }}>
      {children}
    </VizContext.Provider>
  )
}

export function useViz() {
  return useContext(VizContext)
}
