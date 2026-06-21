const EK_KEY = 'viz_wallet_ek'
const WALLET_KEY = 'viz_wallet'

export interface StoredWallet {
  account: string
  keys: { regular?: string; active?: string }
}

async function getOrCreateEk(): Promise<CryptoKey> {
  const stored = localStorage.getItem(EK_KEY)
  if (stored) {
    const raw = Uint8Array.from(atob(stored), (c) => c.charCodeAt(0))
    return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt'])
  }
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
  const raw = await crypto.subtle.exportKey('raw', key)
  localStorage.setItem(EK_KEY, btoa(String.fromCharCode(...new Uint8Array(raw))))
  return key
}

export async function encryptWif(wif: string, ek: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(wif)
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, ek, encoded)
  const combined = new Uint8Array(12 + ciphertext.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(ciphertext), 12)
  return btoa(String.fromCharCode(...combined))
}

export async function decryptWif(ciphertext: string, ek: CryptoKey): Promise<string | null> {
  try {
    const combined = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0))
    const iv = combined.slice(0, 12)
    const data = combined.slice(12)
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, ek, data)
    return new TextDecoder().decode(plain)
  } catch {
    return null
  }
}

export async function saveWallet(
  account: string,
  walletKeys: { regular?: string; active?: string }
): Promise<void> {
  const ek = await getOrCreateEk()
  const encrypted: { regular?: string; active?: string } = {}
  if (walletKeys.regular) encrypted.regular = await encryptWif(walletKeys.regular, ek)
  if (walletKeys.active) encrypted.active = await encryptWif(walletKeys.active, ek)
  localStorage.setItem(WALLET_KEY, JSON.stringify({ account, keys: encrypted }))
}

export async function loadWallet(): Promise<StoredWallet | null> {
  const raw = localStorage.getItem(WALLET_KEY)
  if (!raw) return null
  const { account, keys } = JSON.parse(raw) as {
    account: string
    keys: { regular?: string; active?: string }
  }
  const ek = await getOrCreateEk()
  const decrypted: { regular?: string; active?: string } = {}
  if (keys.regular) {
    const dec = await decryptWif(keys.regular, ek)
    if (dec) decrypted.regular = dec
  }
  if (keys.active) {
    const dec = await decryptWif(keys.active, ek)
    if (dec) decrypted.active = dec
  }
  return { account, keys: decrypted }
}

export function clearWallet(): void {
  localStorage.removeItem(WALLET_KEY)
  // Intentionally keeps viz_wallet_ek — reusable on next connect
}
