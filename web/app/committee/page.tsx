'use client'
import { useState, useEffect } from 'react'
import { useWallet } from '@/lib/wallet'
import { withNode } from '@/lib/core'
import {
  type CommitteeRequest,
  fetchCommitteeRequestIds,
  fetchCommitteeRequest,
  COMMITTEE_STATUSES,
  STATUS_ACTIVE,
} from '@/lib/committee'
import { CommitteeRequestRow } from '@/components/CommitteeRequestRow'
import { CreateProposalModal } from '@/components/CreateProposalModal'

type Tab = 'active' | 'history' | 'all'

export default function CommitteePage() {
  const wallet = useWallet()
  const [requests, setRequests] = useState<CommitteeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('active')
  const [fund, setFund] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        // The list endpoint filters by status, so gather ids across every
        // status, then load each request once (votes are fetched lazily on row
        // expand). Old closed requests are pruned from node state, so this set
        // stays bounded.
        const idLists = await Promise.all(
          COMMITTEE_STATUSES.map(s => fetchCommitteeRequestIds(s).catch(() => [])),
        )
        const ids = [...new Set(idLists.flat())]
        const all = await Promise.all(
          ids.map(id => fetchCommitteeRequest(id).catch(() => null)),
        )
        if (!cancelled) {
          setRequests(all.filter((r): r is CommitteeRequest => r !== null))
        }
      } catch {
        if (!cancelled) setRequests([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    withNode(api => api.getDynamicGlobalProperties())
      .then(dgp => {
        if (!cancelled) setFund((dgp.committee_fund as string) ?? null)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const activeCount = requests.filter(r => r.status === STATUS_ACTIVE).length
  const historyCount = requests.length - activeCount

  const filtered = requests
    .filter(r =>
      tab === 'active' ? r.status === STATUS_ACTIVE
      : tab === 'history' ? r.status !== STATUS_ACTIVE
      : true,
    )
    .sort((a, b) => b.request_id - a.request_id)

  const tabs: { key: Tab; label: string }[] = [
    { key: 'active', label: `Active (${activeCount})` },
    { key: 'history', label: `History (${historyCount})` },
    { key: 'all', label: `All (${requests.length})` },
  ]

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      {/* header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="font-prose text-2xl font-semibold tracking-tight text-fg">Committee</h1>
          {fund && <span className="font-mono text-sm text-fg-dim">{fund} fund</span>}
        </div>
        <button
          onClick={() => {
            if (!wallet.connected) { wallet.openModal('connect'); return }
            if (!wallet.walletKeys.regular) { wallet.openModal('add-key'); return }
            setCreateOpen(true)
          }}
          className="rounded border border-acc-green px-3 py-1.5 font-prose text-sm text-acc-green hover:bg-acc-green/10"
        >+ New proposal</button>
      </div>

      {/* filter tabs */}
      <div className="mb-4 flex border-b border-border">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 font-prose text-sm transition-colors ${
              tab === t.key
                ? 'border-b-2 border-acc-green text-fg'
                : 'text-fg-dim hover:text-fg'
            }`}
          >{t.label}</button>
        ))}
      </div>

      {/* proposal list */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 animate-pulse rounded border border-border bg-surface-2" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center font-prose text-sm text-fg-dim">
          {tab === 'active'
            ? 'No active proposals right now.'
            : 'No proposals.'}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(r => <CommitteeRequestRow key={r.request_id} request={r} />)}
        </div>
      )}

      <CreateProposalModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </main>
  )
}
