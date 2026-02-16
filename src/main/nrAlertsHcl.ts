/**
 * Parse and serialize the nr_nrql_alerts block in Terraform auto.tfvars.
 * Parsing: hcl2-parser only. Write path: find block range + custom serializer (hcl2 has no stringify).
 */
import * as hcl from 'hcl2-parser'
import type { NrAlert } from '@/types/alerts'
export type { NrAlert }

const BLOCK_KEY = 'nr_nrql_alerts'
const BLOCK_START = 'nr_nrql_alerts = ['

/** Find matching closing bracket, skipping content inside quoted strings. */
function findMatchingBracket(
  content: string,
  openAt: number,
  open: string,
  close: string
): number {
  let depth = 1
  let i = openAt + 1
  let inString = false
  let escape = false
  let q = ''

  while (i < content.length && depth > 0) {
    const c = content[i]
    if (escape) {
      escape = false
      i++
      continue
    }
    if (inString) {
      if (c === '\\') escape = true
      else if (c === q) inString = false
      i++
      continue
    }
    if (c === '"' || c === "'") {
      inString = true
      q = c
      i++
      continue
    }
    if (c === open) depth++
    else if (c === close) depth--
    i++
  }
  return depth === 0 ? i - 1 : -1
}

/** Pattern for nr_nrql_alerts block (allows optional spaces around =). */
const BLOCK_START_PATTERN = /nr_nrql_alerts\s*=\s*\[/

/** Locate nr_nrql_alerts = [ ... ] (or nr_nrql_alerts=[) and return range (for replace on save). */
export function getBlockRange(
  content: string
): { start: number; end: number } | null {
  const match = content.match(BLOCK_START_PATTERN)
  if (!match || match.index === undefined) return null
  const blockStartIndex = match.index
  const openAt = blockStartIndex + match[0].length - 1
  const closeAt = findMatchingBracket(content, openAt, '[', ']')
  if (closeAt === -1) return null
  return { start: blockStartIndex, end: closeAt + 1 }
}

/**
 * Parse the nr_nrql_alerts block in chunks to avoid hcl2-parser limits on large input.
 * The library (GopherJS + tmccombs/hcl2json) tends to fail silently for inputs ~77k+ chars.
 */
function parseBlockInChunks(content: string): NrAlert[] | null {
  const range = getBlockRange(content)
  if (!range) return null
  const bracketStart = content.indexOf('[', range.start)
  const innerStart = bracketStart === -1 ? range.start + BLOCK_START.length : bracketStart + 1
  const innerEnd = range.end - 1
  const inner = content.slice(innerStart, innerEnd)
  const alerts: NrAlert[] = []
  let i = 0
  while (i < inner.length) {
    const openIdx = inner.indexOf('{', i)
    if (openIdx === -1) break
    const closeIdx = findMatchingBracket(inner, openIdx, '{', '}')
    if (closeIdx === -1) break
    const objSlice = inner.slice(openIdx, closeIdx + 1)
    const chunk = `nr_nrql_alerts = [${objSlice} ]`
    try {
      const parsed = hcl.parseToObject(chunk)
      const raw = getAlertsRaw(parsed)
      if (Array.isArray(raw) && raw.length > 0) {
        alerts.push(raw[0] as NrAlert)
      }
    } catch {
      return null
    }
    i = closeIdx + 1
  }
  return alerts.length > 0 ? alerts : null
}

/** Extract nr_nrql_alerts array from hcl2 parse result. Handles [obj], obj, or array of blocks. */
function extractAlertsFromParsed(parsed: unknown): NrAlert[] | null {
  if (parsed == null) return null
  const raw = getAlertsRaw(parsed)
  if (!Array.isArray(raw)) return null
  return raw as NrAlert[]
}

function getAlertsRaw(parsed: unknown): unknown {
  if (Array.isArray(parsed)) {
    for (const item of parsed) {
      const a = getAlertsRaw(item)
      if (Array.isArray(a)) return a
    }
    const first = parsed[0]
    if (first != null && typeof first === 'object') {
      const r = (first as Record<string, unknown>)[BLOCK_KEY]
      if (Array.isArray(r)) return r
    }
    return null
  }
  if (typeof parsed === 'object' && parsed !== null) {
    return (parsed as Record<string, unknown>)[BLOCK_KEY] ?? null
  }
  return null
}

export interface ParseResult {
  alerts: NrAlert[]
}

/** Normalize hcl2-parser result: it can return [parsed, error] or just parsed. */
function normalizeParsed(result: unknown): unknown {
  if (Array.isArray(result) && result.length >= 1 && result[1] != null) {
    return result[0]
  }
  return result
}

/** Parse nr_nrql_alerts from full tfvars content using hcl2-parser only. */
export function parseNrNrqlAlerts(content: string): ParseResult | null {
  let parsed: unknown
  try {
    const raw = hcl.parseToObject(content)
    parsed = normalizeParsed(raw)
  } catch {
    return null
  }
  let alerts = extractAlertsFromParsed(parsed)
  if (alerts === null) {
    alerts = parseBlockInChunks(content)
  }
  if (alerts === null) return null
  return { alerts }
}

/** Key order for serialization to match original tfvars style. */
const ALERT_KEY_ORDER = [
  'name',
  'description',
  'nrql_query',
  'runbook_url',
  'severity',
  'enabled',
  'aggregation_method',
  'aggregation_window',
  'aggregation_delay',
  'critical_operator',
  'critical_threshold',
  'critical_threshold_duration',
  'critical_threshold_occurrences',
  'expiration_duration',
  'close_violations_on_expiration',
  'open_violation_on_expiration',
  'fill_option',
  'fill_value',
  'title_template',
  'ignore_on_expected_termination',
  'policy_id',
] as const

const ORDERED_KEYS_SET = new Set(ALERT_KEY_ORDER)

function escapeStringValue(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function formatAlertValue(v: string | number | boolean | undefined): string {
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  if (typeof v === 'number') return String(v)
  if (v === undefined) return 'null'
  return `"${escapeStringValue(String(v))}"`
}

function shouldOmitKey(alert: NrAlert, k: string): boolean {
  if (k === 'close_violations_on_expiration') return alert.close_violations_on_expiration !== true
  if (k === 'expiration_duration') return alert.close_violations_on_expiration !== true
  return false
}

function serializeAlert(alert: NrAlert): string {
  const ordered: Array<[string, string | number | boolean | undefined]> = []
  for (const k of ALERT_KEY_ORDER) {
    if (k in alert && !shouldOmitKey(alert, k)) {
      ordered.push([k, alert[k]])
    }
  }
  const rest = Object.entries(alert).filter(
    ([k]) =>
      !ORDERED_KEYS_SET.has(k as (typeof ALERT_KEY_ORDER)[number]) &&
      !shouldOmitKey(alert, k)
  )
  const lines = [...ordered, ...rest].map(([k, v]) => {
    const key = `"${k.replace(/"/g, '\\"')}"`
    return `    ${key} = ${formatAlertValue(v)}`
  })
  return `  {\n${lines.join('\n')}\n  }`
}

export function serializeNrNrqlAlerts(alerts: NrAlert[]): string {
  const inner = alerts.map(serializeAlert).join(',\n')
  return `${BLOCK_KEY} = [\n${inner}\n]\n`
}

export function replaceNrNrqlAlerts(
  content: string,
  alerts: NrAlert[],
  blockStart: number,
  blockEnd: number
): string {
  return (
    content.slice(0, blockStart) +
    serializeNrNrqlAlerts(alerts) +
    content.slice(blockEnd)
  )
}
