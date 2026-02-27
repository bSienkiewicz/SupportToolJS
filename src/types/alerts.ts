export type NrAlertAggregationMethod = 'CADENCE' | 'EVENT_FLOW' | 'EVENT_TIMER'
export type NrAlertSeverity = 'CRITICAL' | 'WARNING'
export type NrAlertCriticalOperatior =
  | 'ABOVE'
  | 'ABOVE_OR_EQUALS'
  | 'BELOW'
  | 'BELOW_OR_EQUALS'
  | 'EQUALS'
  | 'NOT_EQUALS'
export type NrAlertCriticalThresholdOccurrences = 'ALL' | 'AT_LEAST_ONCE'

export const SEVERITY_OPTIONS: NrAlertSeverity[] = ['CRITICAL', 'WARNING']
export const AGGREGATION_METHOD_OPTIONS: NrAlertAggregationMethod[] = [
  'CADENCE',
  'EVENT_FLOW',
  'EVENT_TIMER'
]
export const CRITICAL_OPERATOR_OPTIONS: NrAlertCriticalOperatior[] = [
  'ABOVE',
  'ABOVE_OR_EQUALS',
  'BELOW',
  'BELOW_OR_EQUALS',
  'EQUALS',
  'NOT_EQUALS'
]
export const CRITICAL_THRESHOLD_OCCURRENCES_OPTIONS: NrAlertCriticalThresholdOccurrences[] = [
  'ALL',
  'AT_LEAST_ONCE'
]

export interface NrAlert {
  name: string
  description: string
  nrql_query: string
  runbook_url: string
  severity: NrAlertSeverity
  enabled: boolean
  aggregation_method: NrAlertAggregationMethod
  aggregation_window: number
  aggregation_delay: number
  critical_operator: NrAlertCriticalOperatior
  critical_threshold: number
  critical_threshold_duration: number
  critical_threshold_occurrences: NrAlertCriticalThresholdOccurrences
  expiration_duration?: number
  close_violations_on_expiration?: boolean
  policy_id?: string
  /** Preserve any extra keys from the file on round-trip */
  [key: string]: string | number | boolean | undefined
}
