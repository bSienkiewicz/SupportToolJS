/**
 * NRQL tokenizer for syntax highlighting.
 * Keywords → purple, strings → green, rest → default.
 */

const NRQL_KEYWORDS = new Set([
  'SELECT',
  'FROM',
  'WHERE',
  'AND',
  'OR',
  'NOT',
  'IN',
  'LIKE',
  'AS',
  'ON',
  'JOIN',
  'LEFT',
  'RIGHT',
  'INNER',
  'OUTER',
  'GROUP',
  'BY',
  'ORDER',
  'LIMIT',
  'OFFSET',
  'SINCE',
  'UNTIL',
  'WITH',
  'TIMEZONE',
  'COMPARE',
  'FACET',
  'PERCENTILE',
  'AVERAGE',
  'COUNT',
  'PERCENTAGE',
  'SUM',
  'MIN',
  'MAX',
  'UNIQUES',
  'DAYS',
  'AGO',
  'HOURS',
  'MINUTES',
  'SECONDS'
])

export type NrqlTokenType = 'keyword' | 'string' | 'plain'

export interface NrqlToken {
  type: NrqlTokenType
  value: string
}

/** Tokenize NRQL: strings (single/double quoted) and keywords (word-boundary). */
export function tokenizeNrql(text: string): NrqlToken[] {
  const tokens: NrqlToken[] = []
  let i = 0
  const n = text.length

  while (i < n) {
    const rest = text.slice(i)
    // Double-quoted string: "..." with \" allowed
    const dq = rest.match(/^"([^"\\]|\\.)*"/)
    if (dq) {
      tokens.push({ type: 'string', value: dq[0] })
      i += dq[0].length
      continue
    }
    // Single-quoted string: '...' with \' allowed
    const sq = rest.match(/^'([^'\\]|\\.)*'/)
    if (sq) {
      tokens.push({ type: 'string', value: sq[0] })
      i += sq[0].length
      continue
    }
    // Word (potential keyword)
    const word = rest.match(/^\b([a-zA-Z_][a-zA-Z0-9_]*)\b/)
    if (word) {
      const key = word[1].toUpperCase()
      const isKeyword = NRQL_KEYWORDS.has(key)
      tokens.push({
        type: isKeyword ? 'keyword' : 'plain',
        value: word[0]
      })
      i += word[0].length
      continue
    }
    // Single character (whitespace, punctuation, etc.)
    tokens.push({ type: 'plain', value: rest[0] ?? '' })
    i += 1
  }

  return tokens
}
