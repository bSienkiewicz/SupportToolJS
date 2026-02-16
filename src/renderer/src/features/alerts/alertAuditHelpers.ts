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

/** For use when detecting/stripping print duration alert names to get carrier name. */
export const PRINT_DURATION_SUFFIX = ALERT_SUFFIXES.printDuration

export type Presence = {
  name: string
  errorRate: boolean
  printDuration: boolean
  /** When print duration alert is configured, its critical_threshold value */
  printDurationThreshold?: number
}

/**
 * Read critical_threshold from an alert in a parser-agnostic way.
 * HCL parser may return different key shapes or string values; coerce to number.
 */
function getNumericCriticalThreshold(alert: NrAlert): number | undefined {
  const obj = alert as Record<string, unknown>
  const raw = obj['critical_threshold'] ?? obj['criticalThreshold']
  if (raw === undefined || raw === null) return undefined
  const n = typeof raw === 'number' ? raw : Number(raw)
  return Number.isFinite(n) ? n : undefined
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
    const printDurationThreshold = hasPrintDuration
      ? getNumericCriticalThreshold(printDurationAlert)
      : undefined
    return {
      name: carrier,
      errorRate: alertByName.has(`${carrier}${ALERT_SUFFIXES.errorRate}`),
      printDuration: hasPrintDuration,
      ...(printDurationThreshold != null && { printDurationThreshold }),
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

function buildPrintDurationAlert(carrier: string, stack: string, criticalThreshold?: number): NrAlert {
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
    critical_threshold: criticalThreshold ?? 5,
    critical_threshold_duration: 300,
    critical_threshold_occurrences: 'ALL',
    close_violations_on_expiration: true,
    expiration_duration: 600,
  }
}

/** NRQL to fetch avg + stddev duration per carrier (only for carriers that have print duration alert). */
export function buildThresholdStatsNrql(carrierNames: string[], samplingDays: number): string {
  const quoted = carrierNames.map((c) => `'${c.replace(/'/g, "''")}'`).join(', ')
  return `SELECT average(duration) AS 'AvgDuration', stddev(duration) AS 'StdDevDuration' FROM Transaction WHERE name LIKE '%.PrintParcel' AND CarrierName IN (${quoted}) AND PrintOperation LIKE '%Create%' SINCE ${samplingDays} days ago FACET CarrierName LIMIT MAX`
}

export type CarrierDurationStatistics = {
  carrierName: string
  averageDuration: number
  standardDeviation: number
}

/** Parse executeNrql result.data (array of { facet, AvgDuration, StdDevDuration, CarrierName }). */
export function parseThresholdStatsResults(data: unknown[]): CarrierDurationStatistics[] {
  const out: CarrierDurationStatistics[] = []
  for (const row of data) {
    if (!row || typeof row !== 'object') continue
    const r = row as Record<string, unknown>
    const facet = r.facet ?? r.CarrierName
    const name = typeof facet === 'string' ? facet : typeof r.CarrierName === 'string' ? r.CarrierName : null
    if (!name) continue
    const avg = Number(r.AvgDuration)
    const stddev = Number(r.StdDevDuration)
    if (Number.isNaN(avg)) continue
    out.push({
      carrierName: name,
      averageDuration: avg,
      standardDeviation: Number.isNaN(stddev) ? 0 : stddev,
    })
  }
  return out
}

export type PrintDurationProposedConfig = {
  method: 'StdDev' | 'Fallback'
  stdDevMultiplier?: number
  minimumAbsoluteThreshold?: number
  maximumAbsoluteThreshold?: number
  minimumStdDev?: number
  formulaMultiplier?: number
  formulaOffset?: number
}

/**
 * Single place for suggested threshold formula and cap: config keys, defaults, and descriptions.
 * Values are read from app config (Settings); missing keys use these defaults.
 */
export const PRINT_DURATION_THRESHOLD_CONFIG = {
  /** Method: 'StdDev' (avg + k*stddev) or 'Fallback' (avg*mult + offset) */
  method: {
    key: 'PrintDuration.ProposedValues.Method',
    default: 'Fallback' as const,
    description: 'StdDev or Fallback',
  },
  /** StdDev method: multiplier for standard deviation (avg + k * stddev) */
  stdDevMultiplier: {
    key: 'PrintDuration.ProposedValues.StdDevMultiplier',
    default: 2,
    description: 'StdDev multiplier (k)',
  },
  /** Minimum allowed threshold (floor) */
  minimumAbsoluteThreshold: {
    key: 'PrintDuration.ProposedValues.MinimumAbsoluteThreshold',
    default: 3,
    description: 'Min threshold (floor)',
  },
  /** Maximum allowed threshold (cap) – suggested value will not exceed this */
  maximumAbsoluteThreshold: {
    key: 'PrintDuration.ProposedValues.MaximumAbsoluteThreshold',
    default: 8,
    description: 'Max threshold (cap)',
  },
  /** StdDev method: minimum stddev to use when actual stddev is very small */
  minimumStdDev: {
    key: 'PrintDuration.ProposedValues.MinimumStdDev',
    default: undefined as number | undefined,
    description: 'Min stddev (optional)',
  },
  /** Fallback formula: proposed = avg * multiplier + offset */
  formulaMultiplier: {
    key: 'PrintDuration.ProposedValues.FormulaMultiplier',
    default: 1.5,
    description: 'Formula multiplier (avg * x + offset)',
  },
  formulaOffset: {
    key: 'PrintDuration.ProposedValues.FormulaOffset',
    default: 3.0,
    description: 'Formula offset (avg * mult + x)',
  },
} as const

const CONFIG_KEYS = {
  method: PRINT_DURATION_THRESHOLD_CONFIG.method.key,
  stdDevMultiplier: PRINT_DURATION_THRESHOLD_CONFIG.stdDevMultiplier.key,
  minThreshold: PRINT_DURATION_THRESHOLD_CONFIG.minimumAbsoluteThreshold.key,
  maxThreshold: PRINT_DURATION_THRESHOLD_CONFIG.maximumAbsoluteThreshold.key,
  minStdDev: PRINT_DURATION_THRESHOLD_CONFIG.minimumStdDev.key,
  formulaMultiplier: PRINT_DURATION_THRESHOLD_CONFIG.formulaMultiplier.key,
  formulaOffset: PRINT_DURATION_THRESHOLD_CONFIG.formulaOffset.key,
} as const

function parseFloatConfig(value: string | null): number | undefined {
  if (value == null || value === '') return undefined
  const n = Number(value)
  return Number.isNaN(n) ? undefined : n
}

/** Load config for proposed threshold calculation (uses PRINT_DURATION_THRESHOLD_CONFIG defaults when keys missing). */
export async function getPrintDurationProposedConfig(): Promise<PrintDurationProposedConfig> {
  const [method, k, minT, maxT, minStd, formMult, formOff] = await Promise.all([
    window.api.getConfigValue(CONFIG_KEYS.method),
    window.api.getConfigValue(CONFIG_KEYS.stdDevMultiplier),
    window.api.getConfigValue(CONFIG_KEYS.minThreshold),
    window.api.getConfigValue(CONFIG_KEYS.maxThreshold),
    window.api.getConfigValue(CONFIG_KEYS.minStdDev),
    window.api.getConfigValue(CONFIG_KEYS.formulaMultiplier),
    window.api.getConfigValue(CONFIG_KEYS.formulaOffset),
  ])
  const cfg: PrintDurationProposedConfig = {
    method: method === 'StdDev' ? 'StdDev' : 'Fallback',
    stdDevMultiplier: parseFloatConfig(k) ?? PRINT_DURATION_THRESHOLD_CONFIG.stdDevMultiplier.default,
    minimumAbsoluteThreshold:
      parseFloatConfig(minT) ?? PRINT_DURATION_THRESHOLD_CONFIG.minimumAbsoluteThreshold.default,
    maximumAbsoluteThreshold:
      parseFloatConfig(maxT) ?? PRINT_DURATION_THRESHOLD_CONFIG.maximumAbsoluteThreshold.default,
    minimumStdDev: parseFloatConfig(minStd) ?? PRINT_DURATION_THRESHOLD_CONFIG.minimumStdDev.default,
    formulaMultiplier: parseFloatConfig(formMult) ?? PRINT_DURATION_THRESHOLD_CONFIG.formulaMultiplier.default,
    formulaOffset: parseFloatConfig(formOff) ?? PRINT_DURATION_THRESHOLD_CONFIG.formulaOffset.default,
  }
  return cfg
}

const DEFAULT_MIN = PRINT_DURATION_THRESHOLD_CONFIG.minimumAbsoluteThreshold.default
const DEFAULT_MAX = PRINT_DURATION_THRESHOLD_CONFIG.maximumAbsoluteThreshold.default

/**
 * Equivalent to C# CalculateSuggestedThreshold.
 * Uses StdDev method when config.method === 'StdDev' and k is set; otherwise fallback formula.
 * Result is always clamped to [min, max] (default max = 8) and rounded to nearest 0.5.
 */
export function calculateSuggestedThreshold(
  stats: CarrierDurationStatistics,
  config: PrintDurationProposedConfig
): number {
  const minCap = config.minimumAbsoluteThreshold ?? DEFAULT_MIN
  const maxCap = config.maximumAbsoluteThreshold ?? DEFAULT_MAX

  let proposed: number
  if (config.method === 'StdDev' && config.stdDevMultiplier != null) {
    let actualStdDev = stats.standardDeviation
    if (config.minimumStdDev != null && actualStdDev < config.minimumStdDev) {
      actualStdDev = config.minimumStdDev
    }
    proposed = stats.averageDuration + config.stdDevMultiplier * actualStdDev
  } else {
    const mult = config.formulaMultiplier ?? PRINT_DURATION_THRESHOLD_CONFIG.formulaMultiplier.default
    const offset = config.formulaOffset ?? PRINT_DURATION_THRESHOLD_CONFIG.formulaOffset.default
    proposed = Math.round((stats.averageDuration * mult + offset) * 100) / 100
  }

  if (proposed < minCap) proposed = minCap
  if (proposed > maxCap) proposed = maxCap
  return Math.round(proposed * 2) / 2
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
  const carriersAddingPrintDuration = [...missingCarriers].filter(
    (carrier) => {
      const presence = presenceByName[carrier]
      return presence && !presence.printDuration && !existingAlertNames.has(`${carrier}${ALERT_SUFFIXES.printDuration}`)
    }
  )
  const samplingDays = 7
  let thresholdsForNewPrintDuration: Record<string, number> = {}
  if (carriersAddingPrintDuration.length > 0) {
    try {
      const nrql = buildThresholdStatsNrql(carriersAddingPrintDuration, samplingDays)
      const nrResult = await window.api.executeNrql(nrql)
      if (!nrResult.error && Array.isArray(nrResult.data)) {
        const statsList = parseThresholdStatsResults(nrResult.data)
        const config = await getPrintDurationProposedConfig()
        for (const stats of statsList) {
          thresholdsForNewPrintDuration[stats.carrierName] = calculateSuggestedThreshold(stats, config)
        }
      }
    } catch {
      // keep default thresholds
    }
  }

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
      const threshold = thresholdsForNewPrintDuration[carrier]
      const alert = buildPrintDurationAlert(carrier, stack, threshold)
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

export type ApplyPrintDurationThresholdsResult = { updatedCount: number; saved: boolean }

/**
 * For each checked carrier that has a proposed threshold value, update the Print Duration
 * alert's critical_threshold and save.
 */
export async function applyPrintDurationThresholds(
  stack: string,
  selectedCarriers: Set<string>,
  proposedThresholds: Record<string, number>
): Promise<ApplyPrintDurationThresholdsResult> {
  const result = await window.api.getNRAlertsForStack(stack)
  if (result.error) {
    toast.error(result.error)
    return { updatedCount: 0, saved: false }
  }
  const alerts = [...result.alerts]
  const alertByName = new Map(alerts.map((a) => [a.name, a]))
  let updatedCount = 0
  for (const carrier of selectedCarriers) {
    const threshold = proposedThresholds[carrier]
    if (threshold == null || typeof threshold !== 'number' || Number.isNaN(threshold)) continue
    const alertName = `${carrier}${ALERT_SUFFIXES.printDuration}`
    const alert = alertByName.get(alertName)
    if (!alert) continue
    const idx = alerts.findIndex((a) => a.name === alertName)
    if (idx === -1) continue
    alerts[idx] = { ...alert, critical_threshold: threshold }
    updatedCount++
  }
  if (updatedCount === 0) {
    toast.info('No thresholds to apply')
    return { updatedCount: 0, saved: false }
  }
  const saveResult = await window.api.saveNRAlertsForStack(stack, alerts)
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
              ? 'Could not write to file'
              : 'Failed to save alerts'
    toast.error(message)
    return { updatedCount: 0, saved: false }
  }
  return { updatedCount, saved: true }
}

export async function buildConfirmationNrql(carrier: string, currentThreshold: number | undefined, proposedThreshold: string, samplingDays: number): Promise<string>{
  const stack = await window.api.getConfigValue('selectedStack');
  return `SELECT average(duration), stddev(duration) as 'Deviation', ${proposedThreshold} as 'Proposed Threshold', ${currentThreshold} as 'Current Threshold' FROM Transaction WHERE PrintOperation like '%Create%' AND host like '%-${stack}-%' AND CarrierName = '${carrier.replace("'", "\\'")}' TIMESERIES MAX SINCE ${samplingDays} days ago`
}