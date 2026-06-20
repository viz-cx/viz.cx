export interface RpcParam {
  name: string
  type: 'string' | 'number' | 'boolean' | 'string[]'
  required: boolean
  description: string
  example?: string | number | boolean
}

export interface RpcMethod {
  name: string
  description: string
  params: RpcParam[]
  resultShape: string
  example?: object
}

export const RPC_METHODS: RpcMethod[] = [
  {
    name: 'get_block',
    description: 'Returns a full block by block number, including all transactions and their operations.',
    params: [
      { name: 'block_num', type: 'number', required: true, description: 'Block height (1-indexed)', example: 1 },
    ],
    resultShape: 'Block object with previous hash, timestamp, witness, and a transactions array.',
    example: { previous: '0000000000000000...', timestamp: '2019-10-01T00:00:00', witness: 'committee', transactions: [] },
  },
  {
    name: 'get_block_header',
    description: 'Returns block header only (lighter than get_block — no transactions).',
    params: [
      { name: 'block_num', type: 'number', required: true, description: 'Block height (1-indexed)', example: 1 },
    ],
    resultShape: 'Object with previous, timestamp, and witness.',
    example: { previous: '0000000000000000...', timestamp: '2019-10-01T00:00:00', witness: 'committee' },
  },
  {
    name: 'get_dynamic_global_properties',
    description: 'Returns live chain state: head block, total supply, vesting fund, reward fund, committee fund, and more.',
    params: [],
    resultShape: 'DynamicGlobalProperties object. Key fields: head_block_number, current_supply, total_vesting_fund, total_vesting_shares, total_reward_fund, committee_fund.',
    example: { head_block_number: 80000000, current_supply: '75000000.000 VIZ', total_vesting_fund: '54000000.000 VIZ' },
  },
  {
    name: 'get_accounts',
    description: 'Returns full account objects for a list of account names.',
    params: [
      { name: 'account_names', type: 'string[]', required: true, description: 'Comma-separated account names', example: 'alice' },
    ],
    resultShape: 'Array of Account objects with balance, vesting_shares, energy (0–10000), json_metadata, and more.',
    example: [{ name: 'alice', balance: '1.000 VIZ', vesting_shares: '100.000000 SHARES', energy: 10000 }],
  },
  {
    name: 'lookup_account_names',
    description: 'Like get_accounts but returns null for accounts that do not exist rather than omitting them.',
    params: [
      { name: 'account_names', type: 'string[]', required: true, description: 'Comma-separated account names', example: 'alice' },
    ],
    resultShape: 'Array of Account objects or null values (null when account not found).',
  },
  {
    name: 'lookup_accounts',
    description: 'Searches accounts whose names start at or after lower_bound. Use for autocomplete.',
    params: [
      { name: 'lower_bound', type: 'string', required: true, description: 'Name prefix to start from', example: 'ali' },
      { name: 'limit', type: 'number', required: true, description: 'Max results (≤1000)', example: 10 },
    ],
    resultShape: 'Array of account name strings.',
    example: ['alice', 'alice2', 'alien'],
  },
  {
    name: 'get_account_history',
    description: 'Returns paginated operation history for an account. from=-1 returns the most recent entries.',
    params: [
      { name: 'account', type: 'string', required: true, description: 'Account name', example: 'alice' },
      { name: 'from', type: 'number', required: true, description: 'History index to start from (-1 = latest)', example: -1 },
      { name: 'limit', type: 'number', required: true, description: 'Number of entries to return (≤1000)', example: 10 },
    ],
    resultShape: 'Array of [index, HistoryItem] tuples. Each HistoryItem has trx_id, block, op_in_trx, virtual_op, timestamp, and op (a [type, data] pair).',
  },
  {
    name: 'get_ops_in_block',
    description: 'Returns all operations in a block, with an option to return only virtual operations.',
    params: [
      { name: 'block_num', type: 'number', required: true, description: 'Block height', example: 1 },
      { name: 'only_virtual', type: 'boolean', required: true, description: 'Return only virtual ops', example: false },
    ],
    resultShape: 'Array of HistoryItem objects (same shape as get_account_history items).',
  },
  {
    name: 'get_transaction',
    description: "Returns a transaction by its ID. Only works within the node's history window.",
    params: [
      { name: 'id', type: 'string', required: true, description: 'Transaction ID (40-char hex)', example: '0000000000000000000000000000000000000000' },
    ],
    resultShape: 'Transaction object with ref_block_num, expiration, operations, and signatures.',
  },
  {
    name: 'get_active_validators',
    description: 'Returns the list of currently scheduled validator (witness) account names.',
    params: [],
    resultShape: 'Array of validator account name strings.',
    example: ['committee', 'validator1', 'validator2'],
  },
  {
    name: 'get_validator_by_account',
    description: 'Returns detailed validator info for an account.',
    params: [
      { name: 'account', type: 'string', required: true, description: 'Validator account name', example: 'committee' },
    ],
    resultShape: 'Validator object with owner, url, total_votes, signing_key, running_version, total_missed.',
  },
  {
    name: 'get_witnesses_by_vote',
    description: 'Returns validators ranked by votes received, paginated.',
    params: [
      { name: 'from', type: 'string', required: true, description: 'Start from this validator name (empty string = first page)', example: '' },
      { name: 'limit', type: 'number', required: true, description: 'Max results (≤100)', example: 21 },
    ],
    resultShape: 'Array of validator objects sorted by total_votes descending.',
  },
  {
    name: 'get_witness_schedule',
    description: 'Returns the current validator schedule.',
    params: [],
    resultShape: 'Object with current_virtual_time, next_shuffle_block_num, and current_shuffled_witnesses.',
  },
  {
    name: 'get_chain_properties',
    description: 'Returns chain governance parameters set by validators (fees, bandwidth limits, energy config).',
    params: [],
    resultShape: 'ChainProperties object with account_creation_fee, maximum_block_size, min_delegation, bandwidth_reserve_percent, and more.',
  },
  {
    name: 'get_config',
    description: 'Returns compile-time constants of this VIZ node.',
    params: [],
    resultShape: 'Config object with VIZ_SYMBOL, SHARES_SYMBOL, CHAIN_ID, CHAIN_NAME, and other compile-time constants.',
  },
  {
    name: 'get_version',
    description: 'Returns the node software version.',
    params: [],
    resultShape: 'Object with blockchain_version, viz_revision, fc_revision.',
    example: { blockchain_version: '0.14.0', viz_revision: 'abc123', fc_revision: 'def456' },
  },
  {
    name: 'get_key_references',
    description: 'Finds accounts that use a given set of public keys.',
    params: [
      { name: 'keys', type: 'string[]', required: true, description: 'Public key strings (VIZ prefix)', example: 'VIZ8GC13uCZbP44HzMLh6bqDPnMHQMnFjTRFnMvdAqQnayFMrBhwq' },
    ],
    resultShape: 'Array of arrays — for each key, a list of account names that hold it.',
  },
  {
    name: 'broadcast_transaction',
    description: "Broadcasts a signed transaction. Requires a fully constructed SignedTransaction object. Use @viz-cx/core's TxBuilder to construct it — this method is not parametrizable in the Playground.",
    params: [],
    resultShape: 'TransactionResult with id, block_num, and expiration.',
  },
]
