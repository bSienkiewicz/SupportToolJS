/**
 * Types for the renderer↔main API (window.api / IPC).
 * Single source of truth so preload and renderer stay in sync with main.
 */
import type { NrAlert } from './alerts'

export type { NrAlert }

/** Result of getGitRepoInfo: current branch (if git repo) and data directory path. */
export interface GitRepoInfo {
  branch: string | null
  dataDir: string | null
}

/** Result of getGitBranches: local branch names and current branch. */
export interface GitBranchesResult {
  branches: string[]
  current: string | null
}

/** Result of gitCheckout / gitCreateBranch / gitPull / gitDiscardAll. */
export interface GitOpResult {
  ok: boolean
  error: string | null
}

/** One uncommitted file from getGitUncommittedChanges. */
export interface GitUncommittedFile {
  path: string
  fullPath: string
  added: number
  deleted: number
  status: string
}

/** Result of getGitUncommittedChanges. */
export interface GitUncommittedChangesResult {
  files: GitUncommittedFile[]
}

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
