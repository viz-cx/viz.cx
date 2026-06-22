import type { Metadata } from 'next'
import { TutorialCard, type TutorialMeta } from '@/components/TutorialCard'

export const metadata: Metadata = { title: 'Learn' }

export const TUTORIALS: TutorialMeta[] = [
  {
    slug: 'read-first-block',
    title: 'Read your first block',
    description: 'Fetch a VIZ block by number and inspect the operations it contains.',
    time: '5 min',
    difficulty: 'beginner',
  },
  {
    slug: 'query-account',
    title: 'Query an account',
    description: 'Read account balances, SHARES, and current energy percentage.',
    time: '5 min',
    difficulty: 'beginner',
  },
  {
    slug: 'stream-live-ops',
    title: 'Stream live operations',
    description: 'Connect to the WebSocket feed and react to operations in real time.',
    time: '10 min',
    difficulty: 'intermediate',
  },
  {
    slug: 'send-award',
    title: 'Send an award',
    description: 'Use @viz-cx/core to construct, sign, and broadcast an award operation.',
    time: '10 min',
    difficulty: 'intermediate',
  },
]

export default function LearnPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Learn</h1>
        <p className="mt-1 font-prose text-sm text-fg-dim">Developer guides for building on VIZ.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {TUTORIALS.map((meta) => (
          <TutorialCard key={meta.slug} meta={meta} />
        ))}
      </div>
    </div>
  )
}
