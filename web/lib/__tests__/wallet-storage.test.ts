import { describe, it, expect, beforeEach } from 'vitest'
import { encryptWif, decryptWif } from '@/lib/wallet-storage'

// localStorage mock for Node environment
const mockStore: Record<string, string> = {}
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: (k: string) => mockStore[k] ?? null,
    setItem: (k: string, v: string) => { mockStore[k] = v },
    removeItem: (k: string) => { delete mockStore[k] },
    clear: () => { Object.keys(mockStore).forEach((k) => delete mockStore[k]) },
  },
  writable: true,
})

async function makeKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
}

const TEST_WIF = '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'

describe('wallet-storage crypto', () => {
  it('encrypt → decrypt round-trip returns original WIF', async () => {
    const ek = await makeKey()
    const ct = await encryptWif(TEST_WIF, ek)
    const plain = await decryptWif(ct, ek)
    expect(plain).toBe(TEST_WIF)
  })

  it('decrypting with a different key returns null', async () => {
    const ek1 = await makeKey()
    const ek2 = await makeKey()
    const ct = await encryptWif(TEST_WIF, ek1)
    const plain = await decryptWif(ct, ek2)
    expect(plain).toBeNull()
  })

  it('encrypting the same WIF twice produces different ciphertext (IV randomness)', async () => {
    const ek = await makeKey()
    const ct1 = await encryptWif(TEST_WIF, ek)
    const ct2 = await encryptWif(TEST_WIF, ek)
    expect(ct1).not.toBe(ct2)
  })
})
