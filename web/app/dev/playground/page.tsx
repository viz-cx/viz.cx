import type { Metadata } from 'next'
import { DocNav } from '@/components/DocNav'
import { Playground } from '@/components/Playground'

export const metadata: Metadata = { title: 'Playground' }

export default function PlaygroundPage() {
  return (
    <div className="flex flex-col gap-6">
      <DocNav active="/dev/playground" />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Playground</h1>
        <p className="mt-1 font-prose text-sm text-fg-dim">
          Build VIZ RPC and REST requests. Copy to run in your terminal or script.
        </p>
      </div>
      <Playground />
    </div>
  )
}
