import type { NrAlert } from '../../../../types/alerts'

const FORBIDDEN_CHARS_REGEX = /[\[\]{}]/g

export function stripForbiddenChars(s: string): string {
  return s.replace(FORBIDDEN_CHARS_REGEX, '')
}

export function hasForbiddenChars(s: string): boolean {
  return /[\[\]{}]/.test(s)
}

export function isExpirationDurationInvalid(alert: NrAlert): boolean {
  if (alert.close_violations_on_expiration !== true) return false
  const v = alert.expiration_duration
  if (v === undefined || v === null) return true
  const n = Number(v)
  return Number.isNaN(n) || n < 0
}

export function isAlertInvalid(alert: NrAlert): boolean {
  return (
    isExpirationDurationInvalid(alert) ||
    hasForbiddenChars(alert.name) ||
    hasForbiddenChars(alert.description) ||
    hasForbiddenChars(alert.nrql_query) ||
    hasForbiddenChars(alert.runbook_url)
  )
}

export type AlertChange =
  | { type: 'modify'; index: number }
  | { type: 'add'; index: number }
  | { type: 'delete'; name: string }

export function newAlertTemplate(index: number): NrAlert {
  return {
    name: `New Alert ${index + 1}`,
    description: '',
    nrql_query: '',
    runbook_url: '',
    severity: 'CRITICAL',
    enabled: true,
    aggregation_method: 'CADENCE',
    aggregation_window: 60,
    aggregation_delay: 0,
    critical_operator: 'ABOVE',
    critical_threshold: 1,
    critical_threshold_duration: 60,
    critical_threshold_occurrences: 'ALL',
    close_violations_on_expiration: false,
    expiration_duration: undefined,
    policy_id: undefined,
  }
}

const ALERT_FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  description: 'Description',
  nrql_query: 'NRQL Query',
  runbook_url: 'Runbook URL',
  severity: 'Severity',
  enabled: 'Enabled',
  aggregation_method: 'Aggregation Method',
  aggregation_window: 'Aggregation Window',
  aggregation_delay: 'Aggregation Delay',
  critical_operator: 'Critical Operator',
  critical_threshold: 'Critical Threshold',
  critical_threshold_duration: 'Critical Threshold Duration',
  critical_threshold_occurrences: 'Critical Threshold Occurrences',
  close_violations_on_expiration: 'Close violations on expiration',
  expiration_duration: 'Expiration Duration',
}

const EDITABLE_KEYS = [
  'name', 'description', 'nrql_query', 'runbook_url', 'severity', 'enabled',
  'aggregation_method', 'aggregation_window', 'aggregation_delay',
  'critical_operator', 'critical_threshold', 'critical_threshold_duration',
  'critical_threshold_occurrences', 'close_violations_on_expiration', 'expiration_duration',
] as const

export type ChangelogItem = { field: string; label: string; from: string; to: string }

export function getAlertChangelog(original: NrAlert, current: NrAlert): ChangelogItem[] {
  const out: ChangelogItem[] = []
  for (const key of EDITABLE_KEYS) {
    const a = original[key]
    const b = current[key]
    const aStr = a === undefined || a === null ? '' : String(a)
    const bStr = b === undefined || b === null ? '' : String(b)
    if (aStr !== bStr) {
      out.push({
        field: key,
        label: ALERT_FIELD_LABELS[key] ?? key,
        from: aStr || '(empty)',
        to: bStr || '(empty)',
      })
    }
  }
  return out
}
