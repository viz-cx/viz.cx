'use client'
import { Card, DefRow } from './ui'
import { NULL_SIGNING_KEY, type RawValidator } from '@/lib/validator'

interface Props {
  validator: RawValidator | null
  declarationFee: string | null
}

export function ValidatorStatusCard({ validator, declarationFee }: Props) {
  if (!validator) {
    return (
      <Card>
        <p className="font-prose text-sm text-fg">You are not a registered validator.</p>
        {declarationFee && (
          <p className="mt-1 font-prose text-xs text-fg-dim">
            Registering for the first time costs a one-time declaration fee of{' '}
            <span className="font-mono text-fg-muted">{declarationFee}</span>, charged by the chain.
          </p>
        )}
      </Card>
    )
  }

  const idle = (validator.signing_key ?? NULL_SIGNING_KEY) === NULL_SIGNING_KEY

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-prose text-sm font-semibold text-fg">{validator.owner}</h2>
        <span
          className={`rounded border px-2 py-0.5 font-mono text-[10px] ${
            idle ? 'border-acc-amber/40 text-acc-amber' : 'border-acc-green/40 text-acc-green'
          }`}
        >
          {idle ? 'IDLE' : 'ACTIVE'}
        </span>
      </div>
      <DefRow label="URL">{validator.url || '—'}</DefRow>
      <DefRow label="Signing key">{validator.signing_key ?? '—'}</DefRow>
      <DefRow label="Running version">{validator.running_version ?? '—'}</DefRow>
      <DefRow label="Total missed">{validator.total_missed ?? 0}</DefRow>
      <DefRow label="Last confirmed block">{validator.last_confirmed_block_num ?? '—'}</DefRow>
    </Card>
  )
}
