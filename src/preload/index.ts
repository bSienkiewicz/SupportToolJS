import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

export type NrAlert = Record<string, string | number | boolean>

const api = {
  getDataDir: () => ipcRenderer.invoke('app:getDataDir') as Promise<string | null>,
  pickDataDir: () => ipcRenderer.invoke('app:pickDataDir') as Promise<string | null>,
  getConfig: () => ipcRenderer.invoke('app:getConfig') as Promise<Record<string, string>>,
  getConfigValue: (key: string) => ipcRenderer.invoke('app:getConfigValue', key) as Promise<string | null>,
  setConfigValue: (key: string, value: string) => ipcRenderer.invoke('app:setConfigValue', key, value) as Promise<void>,
  getNRStacks: () => ipcRenderer.invoke('app:getNRStacks') as Promise<string[]>,
  getNRAlertsForStack: (stack: string) =>
    ipcRenderer.invoke('app:getNRAlertsForStack', stack) as Promise<{
      alerts: NrAlert[]
      filePath: string | null
      error: 'no_data_dir' | 'file_not_found' | 'parse_failed' | null
    }>,
  saveNRAlertsForStack: (filePath: string, alerts: NrAlert[]) =>
    ipcRenderer.invoke('app:saveNRAlertsForStack', filePath, alerts) as Promise<{
      ok: boolean
    }>,
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
