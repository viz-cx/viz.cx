import { describe, it, expect } from 'vitest'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Signature, PrivateKey } = require('viz-js-lib/lib/auth/ecc')
import { verifySig, loginMessage } from '../lib/verify-sig'
describe('verifySig', () => {
  const priv = PrivateKey.fromSeed('test-seed')
  const pub = priv.toPublicKey().toString()
  const msg = loginMessage('abc-123')
  const sig = Signature.signBuffer(Buffer.from(msg, 'utf8'), priv).toHex()
  it('valid sig verifies', () => expect(verifySig(msg, sig, [pub])).toBe(true))
  it('wrong message fails', () => expect(verifySig(loginMessage('other'), sig, [pub])).toBe(false))
  it('wrong key fails', () => {
    const otherPub = PrivateKey.fromSeed('x').toPublicKey().toString()
    expect(verifySig(msg, sig, [otherPub])).toBe(false)
  })
  it('garbage sig returns false, not throw', () => expect(verifySig(msg, 'zz', [pub])).toBe(false))
})
