import type { GetNRAlertsForStackResult, NrAlert } from '@/types/api'
import { toast } from 'sonner'

/** NRQL to fetch unique carrier names for a stack (last 7 days). */
export const NRQL_TEMPLATE = (stack: string) =>
  `SELECT uniques(CarrierName) FROM Transaction WHERE host LIKE '%-${stack}-%' and PrintOperation LIKE '%create%' SINCE 7 days ago`

/** Key in NRQL response: results[0][CARRIERS_KEY] = string[] */
export const CARRIERS_KEY = 'uniques.CarrierName'

/** Alert name suffixes we expect per carrier. */
export const ALERT_SUFFIXES = {
  errorRate: ' - Increased Error Rate',
  printDuration: ' - Increased PrintParcel Duration',
} as const

export type Presence = {
  name: string
  errorRate: boolean
  printDuration: boolean
  /** When print duration alert is configured, its critical_threshold value */
  printDurationThreshold?: number
}

/** Parse carrier names from executeNrql result shape. */
export function extractCarrierNames(results: unknown[]): string[] {
  const first = results[0]
  if (!first || typeof first !== 'object') return []
  const raw = (first as Record<string, unknown>)[CARRIERS_KEY]
  if (!Array.isArray(raw)) return []
  return raw
    .map(String)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
}

/**
 * From getNRAlertsForStack result and carrier list, compute presence per carrier and which are missing any alert.
 * Returns null if result has an error.
 */
export function computeAlertPresence(
  result: GetNRAlertsForStackResult,
  carriers: string[]
): { presence: Presence[]; missingCarriers: string[] } | null {
  if (result.error) return null
  const alertByName = new Map(result.alerts.map((a) => [a.name, a]))
  const presence: Presence[] = carriers.map((carrier) => {
    const printDurationAlertName = `${carrier}${ALERT_SUFFIXES.printDuration}`
    const printDurationAlert = alertByName.get(printDurationAlertName)
    const hasPrintDuration = !!printDurationAlert
    return {
      name: carrier,
      errorRate: alertByName.has(`${carrier}${ALERT_SUFFIXES.errorRate}`),
      printDuration: hasPrintDuration,
      ...(hasPrintDuration &&
        printDurationAlert.critical_threshold != null && {
          printDurationThreshold: printDurationAlert.critical_threshold,
        }),
    }
  })
  const missingCarriers = carriers.filter(
    (_, i) => !(presence[i].errorRate && presence[i].printDuration)
  )
  return { presence, missingCarriers }
}

function buildErrorRateAlert(carrier: string, stack: string): NrAlert {
  return {
    name: `${carrier}${ALERT_SUFFIXES.errorRate}`,
    description: `Faceted Error Rate Percentage alert for ${carrier}`,
    nrql_query: `SELECT percentage(count(*), WHERE ExitStatus = 'Error') FROM Transaction WHERE name = 'WebTransaction/WCF/XLogics.BlackBox.ServiceContracts.IBlackBoxContract.PrintParcel' AND host like '%-${stack}-%' AND CarrierName = '${carrier}' FACET BusinessUnit`,
    runbook_url: 'https://auctane.atlassian.net/wiki/spaces/GSKB/pages/4314432205/Increased+error+rate',
    severity: 'CRITICAL',
    enabled: true,
    aggregation_method: 'EVENT_FLOW',
    aggregation_window: 0,
    aggregation_delay: 120,
    critical_operator: 'ABOVE',
    critical_threshold: 5,
    critical_threshold_duration: 300,
    critical_threshold_occurrences: 'ALL',
    close_violations_on_expiration: true,
    expiration_duration: 600,
  }
}

function buildPrintDurationAlert(carrier: string, stack: string): NrAlert {
  return {
    name: `${carrier}${ALERT_SUFFIXES.printDuration}`,
    description: `Faceted PrintParcel average duration for ${carrier}`,
    nrql_query: `SELECT average(duration) FROM Transaction WHERE name = 'WebTransaction/WCF/XLogics.BlackBox.ServiceContracts.IBlackBoxContract.PrintParcel' AND PrintOperation like '%Create%' AND host like '%-${stack}-%' AND CarrierName = '${carrier}' FACET BusinessUnit`,
    runbook_url: 'https://auctane.atlassian.net/wiki/spaces/GSKB/pages/4314824909/Increased+print+duration',
    severity: 'CRITICAL',
    enabled: true,
    aggregation_method: 'EVENT_FLOW',
    aggregation_window: 0,
    aggregation_delay: 120,
    critical_operator: 'ABOVE',
    critical_threshold: 5,
    critical_threshold_duration: 300,
    critical_threshold_occurrences: 'ALL',
    close_violations_on_expiration: true,
    expiration_duration: 600,
  }
}

export type AddMissingAlertsResult = { addedNames: string[]; saved: boolean }

export async function addMissingAlerts(
  stack: string | null,
  missingCarriers: Set<string>,
  alertPresence: Presence[]
): Promise<AddMissingAlertsResult> {
  if (!stack) return { addedNames: [], saved: false }
  const result = await window.api.getNRAlertsForStack(stack)
  if (result.error) {
    toast.error(result.error)
    return { addedNames: [], saved: false }
  }

  // Start from the full list of all alerts for this stack (do not remove any non-performance alerts).
  const allAlertsForStack: NrAlert[] = [...result.alerts]
  const existingAlertNames = new Set(result.alerts.map((a) => a.name))

  const presenceByName: Record<string, Presence> = {}
  alertPresence.forEach((p) => {
    presenceByName[p.name] = p
  })

  const addedNames: string[] = []

  for (const carrier of missingCarriers) {
    const presence = presenceByName[carrier]
    if (!presence) continue

    if (!presence.errorRate && !existingAlertNames.has(`${carrier}${ALERT_SUFFIXES.errorRate}`)) {
      const alert = buildErrorRateAlert(carrier, stack)
      allAlertsForStack.push(alert)
      existingAlertNames.add(alert.name)
      addedNames.push(alert.name)
    }
    if (!presence.printDuration && !existingAlertNames.has(`${carrier}${ALERT_SUFFIXES.printDuration}`)) {
      const alert = buildPrintDurationAlert(carrier, stack)
      allAlertsForStack.push(alert)
      existingAlertNames.add(alert.name)
      addedNames.push(alert.name)
    }
  }

  const saveResult = await window.api.saveNRAlertsForStack(stack, allAlertsForStack)
  if (!saveResult.ok) {
    const err = saveResult.error
    const message =
      err === 'block_not_found'
        ? 'nr_nrql_alerts block not found in auto.tfvars'
        : err === 'file_not_found'
          ? 'Stack auto.tfvars file not found'
          : err === 'no_data_dir'
            ? 'Data directory not configured'
            : err === 'write_failed'
              ? 'Could not write to file (permission or disk error)'
              : 'Failed to save alerts to file'
    toast.error(message)
    return { addedNames: [], saved: false }
  }
  return { addedNames, saved: true }
}