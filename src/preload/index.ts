import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { NrAlert, GetNRAlertsForStackResult, SaveNRAlertsForStackResult, ExecuteNrqlResult } from '@/types/api'

const api = {
  getDataDir: () => ipcRenderer.invoke('app:getDataDir') as Promise<string | null>,
  pickDataDir: () => ipcRenderer.invoke('app:pickDataDir') as Promise<string | null>,
  getConfig: () => ipcRenderer.invoke('app:getConfig') as Promise<Record<string, string>>,
  getConfigValue: (key: string) => ipcRenderer.invoke('app:getConfigValue', key) as Promise<string | null>,
  setConfigValue: (key: string, value: string) => ipcRenderer.invoke('app:setConfigValue', key, value) as Promise<void>,
  getNRStacks: () => ipcRenderer.invoke('app:getNRStacks') as Promise<string[]>,
  getNRAlertsForStack: (stack: string) =>
    ipcRenderer.invoke('app:getNRAlertsForStack', stack) as Promise<GetNRAlertsForStackResult>,
  saveNRAlertsForStack: (stack: string, alerts: NrAlert[]) =>
    ipcRenderer.invoke('app:saveNRAlertsForStack', stack, alerts) as Promise<SaveNRAlertsForStackResult>,
  executeNrql: (nrqlQuery: string) =>
    ipcRenderer.invoke('app:executeNrql', nrqlQuery) as Promise<ExecuteNrqlResult>,
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
