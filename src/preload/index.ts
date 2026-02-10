import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  getDataDir: () => ipcRenderer.invoke('app:getDataDir') as Promise<string | null>,
  pickDataDir: () => ipcRenderer.invoke('app:pickDataDir') as Promise<string | null>,
  getConfig: () => ipcRenderer.invoke('app:getConfig') as Promise<Record<string, string>>,
  getConfigValue: (key: string) => ipcRenderer.invoke('app:getConfigValue', key) as Promise<string | null>,
  setConfigValue: (key: string, value: string) => ipcRenderer.invoke('app:setConfigValue', key, value) as Promise<void>,
  getNRStacks: () => ipcRenderer.invoke('app:getNRStacks') as Promise<any[]>
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
