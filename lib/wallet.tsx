'use client'
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { saveWallet, loadWallet, clearWallet } from './wallet-storage'

export interface WalletState {
  account: string | null
  keyFor(account: string): Promise<string | null>
  saveKey(account: string, wif: string): Promise<void>
  logout(): Promise<void>
}

const WalletContext = createContext<WalletState | null>(null)

export function useWallet(): WalletState {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider')
  return ctx
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null)

  useEffect(() => {
    loadWallet()
      .then((stored) => { if (stored?.account) setAccount(stored.account) })
      .catch((err) => {
        console.warn('[wallet] Failed to restore wallet, clearing corrupted state:', err)
        clearWallet()
      })
  }, [])

  const keyFor = useCallback(async (acc: string): Promise<string | null> => {
    const stored = await loadWallet()
    if (!stored || stored.account !== acc) return null
    return stored.keys.regular ?? null
  }, [])

  const saveKey = useCallback(async (acc: string, wif: string): Promise<void> => {
    await saveWallet(acc, { regular: wif })
    setAccount(acc)
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    clearWallet()
    setAccount(null)
  }, [])

  return (
    <WalletContext.Provider value={{ account, keyFor, saveKey, logout }}>
      {children}
    </WalletContext.Provider>
  )
}
