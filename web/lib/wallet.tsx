'use client'
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { keys, createHttpTransport, createReadApi, type Wif } from '@viz-cx/core'
import { saveWallet, loadWallet, clearWallet } from './wallet-storage'
import { NODE_ENDPOINTS } from './config'

export type ModalMode = 'connect' | 'add-key'

export interface WalletState {
  account: string | null
  walletKeys: { regular?: Wif; active?: Wif }
  connected: boolean
  modalOpen: boolean
  modalMode: ModalMode
  connect(account: string, input: string, role?: 'regular' | 'active'): Promise<void>
  addKey(input: string, role: 'regular' | 'active'): Promise<void>
  disconnect(): void
  openModal(mode?: ModalMode): void
  closeModal(): void
}

const WalletContext = createContext<WalletState | null>(null)

export function useWallet(): WalletState {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider')
  return ctx
}

async function validateKey(
  acc: string,
  wif: Wif,
  role: 'regular' | 'active'
): Promise<void> {
  const transport = createHttpTransport(NODE_ENDPOINTS[0])
  const api = createReadApi(transport)
  const [accountData] = await api.lookupAccountNames([acc])
  if (!accountData) throw new Error('Account not found')
  const pub = String(keys.toPublic(wif))
  // lookupAccountNames returns the raw RPC payload: authorities are exposed as
  // `<role>_authority` with snake_case `key_auths` (NOT the camelCase Authority type).
  const raw = accountData as unknown as Record<
    string,
    { key_auths?: Array<[string, number]> } | null
  >
  const authority = raw[`${role}_authority`]
  const authorizedKeys = authority?.key_auths?.map(([k]) => String(k)) ?? []
  if (!authorizedKeys.includes(pub)) throw new Error('Key does not match this account')
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null)
  const [walletKeys, setWalletKeys] = useState<{ regular?: Wif; active?: Wif }>({})
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<ModalMode>('connect')

  useEffect(() => {
    loadWallet()
      .then((stored) => {
        if (stored?.account) {
          setAccount(stored.account)
          setWalletKeys({
            regular: stored.keys.regular as Wif | undefined,
            active: stored.keys.active as Wif | undefined,
          })
        }
      })
      .catch((err) => {
        console.warn('[wallet] Failed to restore wallet, clearing corrupted state:', err)
        clearWallet()
      })
  }, [])

  const connect = useCallback(
    async (acc: string, input: string, role?: 'regular' | 'active') => {
      let keysToStore: { regular?: Wif; active?: Wif }

      if (keys.isWif(input)) {
        const r = role ?? 'regular'
        await validateKey(acc, input as Wif, r)
        keysToStore = { [r]: input as Wif }
      } else {
        const keySet = keys.fromPassword(acc, input)
        await validateKey(acc, keySet.regular, 'regular')
        keysToStore = { regular: keySet.regular, active: keySet.active }
      }

      await saveWallet(acc, keysToStore as { regular?: string; active?: string })
      setAccount(acc)
      setWalletKeys(keysToStore)
    },
    []
  )

  const addKey = useCallback(
    async (input: string, role: 'regular' | 'active') => {
      if (!account) throw new Error('Not connected')
      const wif = keys.isWif(input)
        ? (input as Wif)
        : keys.fromPassword(account, input, role)
      await validateKey(account, wif, role)
      const newKeys = { ...walletKeys, [role]: wif }
      await saveWallet(account, newKeys as { regular?: string; active?: string })
      setWalletKeys(newKeys)
    },
    [account, walletKeys]
  )

  const disconnect = useCallback(() => {
    clearWallet()
    setAccount(null)
    setWalletKeys({})
  }, [])

  const openModal = useCallback((mode: ModalMode = 'connect') => {
    setModalMode(mode)
    setModalOpen(true)
  }, [])

  const closeModal = useCallback(() => setModalOpen(false), [])

  return (
    <WalletContext.Provider
      value={{
        account,
        walletKeys,
        connected: account !== null,
        modalOpen,
        modalMode,
        connect,
        addKey,
        disconnect,
        openModal,
        closeModal,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}
