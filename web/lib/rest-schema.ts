export interface RestParam {
  name: string
  in: 'path' | 'query'
  type: 'string' | 'number'
  required: boolean
  description: string
  example?: string | number
}

export interface RestEndpoint {
  method: 'GET'
  path: string
  description: string
  params: RestParam[]
}

export const REST_ENDPOINTS: RestEndpoint[] = [
  {
    method: 'GET',
    path: '/blocks/latest',
    description: 'Latest indexed block with all its operations.',
    params: [],
  },
  {
    method: 'GET',
    path: '/blocks/{id}',
    description: 'A block by block number with all its operations.',
    params: [
      { name: 'id', in: 'path', type: 'number', required: true, description: 'Block number', example: 1 },
    ],
  },
  {
    method: 'GET',
    path: '/profile/{user}',
    description: 'Account profile: balance, SHARES, energy, and metadata.',
    params: [
      { name: 'user', in: 'path', type: 'string', required: true, description: 'Account name', example: 'alice' },
    ],
  },
  {
    method: 'GET',
    path: '/profile/avatar/{user}',
    description: 'Account avatar as an SVG identicon.',
    params: [
      { name: 'user', in: 'path', type: 'string', required: true, description: 'Account name', example: 'alice' },
    ],
  },
  {
    method: 'GET',
    path: '/richlist',
    description: 'Cached snapshot of the top 200 accounts by effective capital.',
    params: [],
  },
]
