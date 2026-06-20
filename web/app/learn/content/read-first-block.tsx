import { CodeBlock } from '@/components/CodeBlock'

const CURL = `curl -X POST https://node.viz.cx \\
  -H 'Content-Type: application/json' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"get_block","params":{"block_num":1}}'`

const RESPONSE = `{
  "previous": "0000000000000000000000000000000000000000",
  "timestamp": "2019-10-01T07:00:00",
  "witness": "committee",
  "transaction_merkle_root": "0000000000000000000000000000000000000000",
  "transactions": []
}`

const SDK = `import { createClient } from '@viz-cx/core'

const client = createClient({ endpoint: 'https://node.viz.cx' })

const block = await client.api.getBlock(1)
if (!block) { console.log('block not found'); process.exit(1) }

console.log('timestamp:', block.timestamp)
console.log('witness:  ', block.witness)
console.log('tx count: ', block.transaction_ids.length)`

const INSPECT = `curl -X POST https://node.viz.cx \\
  -H 'Content-Type: application/json' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"get_ops_in_block","params":{"block_num":1,"only_virtual":false}}'`

export default async function ReadFirstBlock() {
  return (
    <>
      <p>
        Every VIZ transaction is packed into a block. This guide shows you how to fetch a block by
        number and inspect the operations inside it — using both a raw RPC call and the{' '}
        <code>@viz-cx/core</code> TypeScript SDK.
      </p>

      <h3>Step 1 — Fetch a block with curl</h3>
      <p>
        VIZ nodes speak JSON-RPC 2.0 over HTTP POST. Send a <code>get_block</code> request to the
        public node:
      </p>
      <CodeBlock code={CURL} lang="bash" />
      <p>The node returns a block object:</p>
      <CodeBlock code={RESPONSE} lang="json" />

      <h3>Step 2 — Same call via @viz-cx/core</h3>
      <p>
        The SDK wraps the RPC call and handles serialization. <code>getBlock</code> returns{' '}
        <code>null</code> for blocks that do not exist yet.
      </p>
      <CodeBlock code={SDK} lang="typescript" />

      <h3>Step 3 — Inspect the operations in a block</h3>
      <p>
        <code>get_ops_in_block</code> returns the full operation list with metadata (transaction ID,
        op type, timestamp). The <code>only_virtual</code> flag filters to virtual ops (consensus
        rewards) when true.
      </p>
      <CodeBlock code={INSPECT} lang="bash" />

      <p>
        Each operation is a <code>[type, data]</code> tuple. Common types: <code>transfer</code>,{' '}
        <code>award</code>, <code>account_create</code>, <code>delegate_vesting_shares</code>.
      </p>
    </>
  )
}
