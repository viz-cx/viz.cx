'use client'
import type { RpcParam } from '@/lib/rpc-schema'
import type { RestParam } from '@/lib/rest-schema'

type AnyParam = RpcParam | RestParam

interface Props {
  param: AnyParam
  value: string
  onChange: (value: string) => void
}

export function ParamInput({ param, value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-mono text-fg">{param.name}</span>
        <span className="text-[10px] font-mono text-acc-amber">{param.type}</span>
        {param.required && <span className="text-[10px] text-acc-red">*</span>}
      </div>
      <p className="text-[10px] font-prose text-fg-dim">{param.description}</p>
      {param.type === 'boolean' ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-surface-2 border border-border rounded px-2 py-1 text-xs text-fg focus:outline-none focus:border-border-strong"
        >
          <option value="">—</option>
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      ) : (
        <input
          type={param.type === 'number' ? 'number' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={param.example != null ? String(param.example) : param.type === 'string[]' ? 'alice, bob' : ''}
          className="bg-surface-2 border border-border rounded px-2 py-1 text-xs text-fg placeholder:text-fg-dim focus:outline-none focus:border-border-strong"
        />
      )}
    </div>
  )
}
