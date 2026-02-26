import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { NrAlert, GetNRAlertsForStackResult, SaveNRAlertsForStackResult, ExecuteNrqlResult } from '@/types/api'

const api = {
  getVersion: () => ipcRenderer.invoke('app:getVersion') as Promise<string>,
  getDataDir: () => ipcRenderer.invoke('app:getDataDir') as Promise<string | null>,
  getGitRepoInfo: () => ipcRenderer.invoke('app:getGitRepoInfo') as Promise<import('@/types/api').GitRepoInfo>,
  getGitBranches: () => ipcRenderer.invoke('app:getGitBranches') as Promise<import('@/types/api').GitBranchesResult>,
  gitCheckout: (branch: string) => ipcRenderer.invoke('app:gitCheckout', branch) as Promise<import('@/types/api').GitOpResult>,
  gitCreateBranch: (newName: string, fromBranch: string) =>
    ipcRenderer.invoke('app:gitCreateBranch', newName, fromBranch) as Promise<import('@/types/api').GitOpResult>,
  gitPull: () => ipcRenderer.invoke('app:gitPull') as Promise<import('@/types/api').GitOpResult>,
  getGitUncommittedChanges: () =>
    ipcRenderer.invoke('app:getGitUncommittedChanges') as Promise<import('@/types/api').GitUncommittedChangesResult>,
  gitDiscardAll: () => ipcRenderer.invoke('app:gitDiscardAll') as Promise<import('@/types/api').GitOpResult>,
  gitDiscardFile: (path: string) =>
    ipcRenderer.invoke('app:gitDiscardFile', path) as Promise<import('@/types/api').GitOpResult>,
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
  checkForUpdate: () =>
    ipcRenderer.invoke('app:checkForUpdate') as Promise<{
      updateAvailable: boolean
      currentVersion: string
      latestVersion?: string
      releaseUrl?: string
      downloadUrl?: string | null
      error?: string
    }>,
  openUrl: (url: string) => ipcRenderer.invoke('app:openUrl', url) as Promise<void>,
  getReleasesUrl: () => ipcRenderer.invoke('app:getReleasesUrl') as Promise<string>,
  resetSettings: () => ipcRenderer.invoke('app:resetSettings') as Promise<void>,
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
