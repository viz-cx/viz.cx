export interface PostData {
  t?: string
  s?: string
  i?: string
  m?: string
  d?: string
  r?: string
}

export interface Post {
  author: string
  block: number
  t?: string
  d: PostData
  blocks?: EditorJSBlock[]
  source?: "blockchain" | "local"
  editable?: boolean
  timestamp: string
  shares: number
  awards: number
  comments: number
  show?: boolean
  _id?: string
}

export interface EditorJSBlock {
  type: string
  data: Record<string, any>
}

export interface Comment extends Post {
  replies?: Comment[]
}

export interface Account {
  name: string
  balance: string
  vesting_shares: string
  delegated_vesting_shares: string
  received_vesting_shares: string
  energy: number
  last_vote_time: string
  custom_sequence_block_num: number
  json_metadata: string
}
