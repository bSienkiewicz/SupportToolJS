/**
 * Types for the renderer↔main API (window.api / IPC).
 * Single source of truth so preload and renderer stay in sync with main.
 */
import type { NrAlert } from './alerts'

export type { NrAlert }

/** Result of getNRAlertsForStack: alerts from file for a stack, or error code. */
export interface GetNRAlertsForStackResult {
  alerts: NrAlert[]
  filePath: string | null
  error: 'no_data_dir' | 'file_not_found' | 'parse_failed' | null
}

/** Result of saveNRAlertsForStack. */
export interface SaveNRAlertsForStackResult {
  ok: boolean
}

/** Result of executeNrql (NRQL query via New Relic GraphQL). */
export interface ExecuteNrqlResult {
  data: unknown[] | null
  error: string | null
}
