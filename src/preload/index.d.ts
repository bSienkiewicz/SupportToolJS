import { ElectronAPI } from '@electron-toolkit/preload'

export type NrAlert = Record<string, string | number | boolean>

export interface AppAPI {
  getDataDir: () => Promise<string | null>
  pickDataDir: () => Promise<string | null>
  getConfig: () => Promise<Record<string, string>>
  getConfigValue: (key: string) => Promise<string | null>
  setConfigValue: (key: string, value: string) => Promise<void>
  getNRStacks: () => Promise<string[]>
  getNRAlertsForStack: (stack: string) => Promise<{
    alerts: NrAlert[]
    filePath: string | null
    error: 'no_data_dir' | 'file_not_found' | 'parse_failed' | null
  }>
  saveNRAlertsForStack: (
    filePath: string,
    alerts: NrAlert[]
  ) => Promise<{ ok: boolean }>
  executeNrql: (nrqlQuery: string) => Promise<{
    data: unknown[] | null
    error: string | null
  }>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: AppAPI
  }
}
