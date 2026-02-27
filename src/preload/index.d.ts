import type { ElectronAPI } from '@electron-toolkit/preload'
import type {
  NrAlert,
  GetNRAlertsForStackResult,
  SaveNRAlertsForStackResult,
  ExecuteNrqlResult
} from '@/types/api'

export type { NrAlert, GetNRAlertsForStackResult, SaveNRAlertsForStackResult, ExecuteNrqlResult }

export interface AppAPI {
  getVersion: () => Promise<string>
  getPlatform: () => Promise<NodeJS.Platform>
  getDataDir: () => Promise<string | null>
  getGitRepoInfo: () => Promise<import('@/types/api').GitRepoInfo>
  getGitBranches: () => Promise<import('@/types/api').GitBranchesResult>
  gitCheckout: (branch: string) => Promise<import('@/types/api').GitOpResult>
  gitCreateBranch: (
    newName: string,
    fromBranch: string
  ) => Promise<import('@/types/api').GitOpResult>
  gitPull: () => Promise<import('@/types/api').GitOpResult>
  getGitUncommittedChanges: () => Promise<import('@/types/api').GitUncommittedChangesResult>
  gitDiscardAll: () => Promise<import('@/types/api').GitOpResult>
  gitDiscardFile: (path: string) => Promise<import('@/types/api').GitOpResult>
  pickDataDir: () => Promise<string | null>
  getConfig: () => Promise<Record<string, string>>
  getConfigValue: (key: string) => Promise<string | null>
  setConfigValue: (key: string, value: string) => Promise<void>
  getNRStacks: () => Promise<string[]>
  getNRAlertsForStack: (stack: string) => Promise<GetNRAlertsForStackResult>
  saveNRAlertsForStack: (stack: string, alerts: NrAlert[]) => Promise<SaveNRAlertsForStackResult>
  executeNrql: (nrqlQuery: string) => Promise<ExecuteNrqlResult>
  checkForUpdate: () => Promise<{
    updateAvailable: boolean
    currentVersion: string
    latestVersion?: string
    releaseUrl?: string
    downloadUrl?: string | null
    error?: string
  }>
  openUrl: (url: string) => Promise<void>
  getReleasesUrl: () => Promise<string>
  resetSettings: () => Promise<void>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: AppAPI
  }
}
