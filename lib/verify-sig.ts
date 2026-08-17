// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Signature, PublicKey } = require('viz-js-lib/lib/auth/ecc')
export const loginMessage = (nonce: string): string => `viz.cx-login:${nonce}`
export function verifySig(message: string, sigHex: string, pubkeys: string[]): boolean {
  try {
    const sig = Signature.fromHex(sigHex)
    const buf = Buffer.from(message, 'utf8')
    return pubkeys.some(k => { try { return sig.verifyBuffer(buf, PublicKey.fromString(k)) } catch { return false } })
  } catch { return false }
}
