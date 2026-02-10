import { ElectronAPI } from '@electron-toolkit/preload'

export interface AppAPI {
  getDataDir: () => Promise<string | null>
  pickDataDir: () => Promise<string | null>
  getConfig: () => Promise<Record<string, string>>
  getConfigValue: (key: string) => Promise<string | null>
  setConfigValue: (key: string, value: string) => Promise<void>
  getNRStacks: () => Promise<any[]>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: AppAPI
  }
}
