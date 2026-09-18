const MAX = BigInt('9223372036854775807')   // int8 max; larger values overflow bigint columns
export const isId = (s: unknown): s is string =>
  typeof s === 'string' && /^\d{1,19}$/.test(s) && BigInt(s) <= MAX
