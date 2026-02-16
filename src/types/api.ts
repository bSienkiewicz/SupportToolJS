/**
 * Types for the renderer↔main API (window.api / IPC).
 * Single source of truth so preload and renderer stay in sync with main.
 */
import type { NrAlert } from './alerts'

export type { NrAlert }

/** Result of getNRAlertsForStack: alerts from file for a stack, or error code. */
export interface GetNRAlertsForStackResult {
  alerts: NrAlert[]
  error: 'no_data_dir' | 'file_not_found' | 'parse_failed' | null
}

/** Result of saveNRAlertsForStack. */
export interface SaveNRAlertsForStackResult {
  ok: boolean
  /** Reason when ok is false. */
  error?: 'no_data_dir' | 'file_not_found' | 'block_not_found' | 'write_failed'
}

/** Result of executeNrql (NRQL query via New Relic GraphQL). */
export interface ExecuteNrqlResult {
  data: unknown[] | null
  error: string | null
}
