import { CodeBlock } from '@/components/CodeBlock'

const CONNECT = `const ws = new WebSocket('wss://api.viz.cx/ws/ops')

ws.onopen = () => console.log('connected')

ws.onmessage = (event) => {
  const item = JSON.parse(event.data)
  // item shape:
  // { trx_id, block, trx_in_block, op_in_trx, virtual_op, timestamp, op }
  const [opType, opData] = item.op
  console.log(item.timestamp, opType, opData)
}

ws.onclose = () => console.log('disconnected')
ws.onerror = (e) => console.error('ws error', e)`

const FILTER = `ws.onmessage = (event) => {
  const item = JSON.parse(event.data)
  const [opType, opData] = item.op

  // Only react to award operations
  if (opType !== 'award') return

  console.log(
    \`\${opData.initiator} awarded \${opData.receiver}\`,
    \`energy: \${opData.energy / 100}%\`,
    opData.memo ?? ''
  )
}`

const RECONNECT = `function connect() {
  const ws = new WebSocket('wss://api.viz.cx/ws/ops')

  ws.onmessage = (event) => {
    const item = JSON.parse(event.data)
    const [opType, opData] = item.op
    if (opType === 'award') {
      console.log(\`award: \${opData.initiator} → \${opData.receiver}\`)
    }
  }

  ws.onclose = () => {
    console.log('reconnecting in 3s…')
    setTimeout(connect, 3000)
  }

  ws.onerror = () => ws.close()

  return ws
}

const ws = connect()`

export default async function StreamLiveOps() {
  return (
    <>
      <p>
        <code>wss://api.viz.cx/ws/ops</code> emits a message for every operation applied to the
        chain within ~5 blocks of the tip. This makes it easy to react to live awards, transfers,
        and other events without polling.
      </p>

      <h3>Step 1 — Connect and log all operations</h3>
      <p>
        Each message is a JSON-encoded operation record. The <code>op</code> field is a{' '}
        <code>[type, data]</code> tuple, e.g.{' '}
        <code>{"['award', { initiator: 'alice', receiver: 'bob', energy: 100 }]"}</code>.
      </p>
      <CodeBlock code={CONNECT} lang="typescript" />

      <h3>Step 2 — Filter by operation type</h3>
      <p>
        Most apps care about a subset of op types. Filter by checking <code>opType</code>. Common
        types: <code>award</code>, <code>transfer</code>, <code>account_create</code>,{' '}
        <code>delegate_vesting_shares</code>.
      </p>
      <CodeBlock code={FILTER} lang="typescript" />

      <h3>Step 3 — Add reconnect logic</h3>
      <p>
        WebSocket connections drop. A simple 3-second retry on <code>onclose</code> is sufficient
        for most use cases.
      </p>
      <CodeBlock code={RECONNECT} lang="typescript" />
    </>
  )
}
