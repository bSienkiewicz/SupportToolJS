import type { ElectronAPI } from '@electron-toolkit/preload'
import type {
  NrAlert,
  GetNRAlertsForStackResult,
  SaveNRAlertsForStackResult,
  ExecuteNrqlResult,
} from '@/types/api'

export type { NrAlert, GetNRAlertsForStackResult, SaveNRAlertsForStackResult, ExecuteNrqlResult }

export interface AppAPI {
  getDataDir: () => Promise<string | null>
  pickDataDir: () => Promise<string | null>
  getConfig: () => Promise<Record<string, string>>
  getConfigValue: (key: string) => Promise<string | null>
  setConfigValue: (key: string, value: string) => Promise<void>
  getNRStacks: () => Promise<string[]>
  getNRAlertsForStack: (stack: string) => Promise<GetNRAlertsForStackResult>
  saveNRAlertsForStack: (filePath: string, alerts: NrAlert[]) => Promise<SaveNRAlertsForStackResult>
  executeNrql: (nrqlQuery: string) => Promise<ExecuteNrqlResult>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: AppAPI
  }
}
