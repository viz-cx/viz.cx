'use client'
import { useState } from 'react'
import type { ChainProperties } from '@viz-cx/core'
import { PROPS_GROUPS, validateProps, type PropsField } from '@/lib/validator'

interface Props {
  initial: ChainProperties
  onSubmit: (props: ChainProperties) => void
  submitting: boolean
}

/** Converts a raw form value (string) into the typed value a ChainProperties field expects. */
function toFieldValue(field: PropsField, raw: string): string | number {
  if (field.kind === 'asset-viz') return `${parseFloat(raw || '0').toFixed(3)} VIZ`
  if (field.kind === 'asset-shares') return `${parseFloat(raw || '0').toFixed(6)} SHARES`
  return Number(raw)
}

/** Converts a typed ChainProperties field value back into a plain number for the input. */
function toInputNumber(field: PropsField, value: unknown): number {
  if (field.kind === 'asset-viz' || field.kind === 'asset-shares') return parseFloat(String(value ?? '0'))
  return Number(value ?? 0)
}

export function ChainPropertiesForm({ initial, onSubmit, submitting }: Props) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {}
    for (const group of PROPS_GROUPS) {
      for (const field of group.fields) {
        out[field.key] = String(toInputNumber(field, initial[field.key]))
      }
    }
    return out
  })
  const [openGroup, setOpenGroup] = useState<string | null>(PROPS_GROUPS[0]!.name)
  const [errors, setErrors] = useState<string[]>([])

  function handleChange(key: string, raw: string) {
    setValues((v) => ({ ...v, [key]: raw }))
  }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const props = { ...initial } as Record<string, string | number>
    for (const group of PROPS_GROUPS) {
      for (const field of group.fields) {
        props[field.key] = toFieldValue(field, values[field.key] ?? '0')
      }
    }
    const validationErrors = validateProps(props as unknown as ChainProperties)
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }
    setErrors([])
    onSubmit(props as unknown as ChainProperties)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <p className="rounded border border-acc-amber/40 bg-acc-amber/10 px-3 py-2 font-prose text-xs text-acc-amber">
        These values are votes on network-wide parameters — your input is combined with other
        validators via median, not applied to you alone.
      </p>

      {PROPS_GROUPS.map((group) => (
        <div key={group.name} className="rounded border border-border">
          <button
            type="button"
            onClick={() => setOpenGroup(openGroup === group.name ? null : group.name)}
            className="flex w-full items-center justify-between px-3 py-2 font-prose text-xs font-semibold uppercase tracking-widest text-fg-muted"
          >
            {group.name}
            <span>{openGroup === group.name ? '−' : '+'}</span>
          </button>
          {openGroup === group.name && (
            <div className="flex flex-col gap-2 border-t border-border p-3">
              {group.fields.map((field) => (
                <div key={field.key} className="flex flex-col gap-1">
                  <label htmlFor={`props-${field.key}`} className="font-prose text-[11px] text-fg-dim">
                    {field.label}
                    {field.unit ? ` (${field.unit})` : ''}
                  </label>
                  <input
                    id={`props-${field.key}`}
                    type="number"
                    step="any"
                    value={values[field.key] ?? ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className="rounded border border-border bg-surface-2 px-3 py-1.5 font-mono text-sm text-fg focus:border-border-strong focus:outline-none"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {errors.length > 0 && (
        <div className="rounded border border-acc-red/40 bg-acc-red/10 px-3 py-2">
          {errors.map((e) => (
            <p key={e} className="font-prose text-xs text-acc-red">{e}</p>
          ))}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded bg-acc-green py-2 font-prose text-sm font-semibold text-canvas hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? 'Processing…' : 'Review changes'}
      </button>
    </form>
  )
}
