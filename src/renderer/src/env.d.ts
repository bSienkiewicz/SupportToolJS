/// <reference types="vite/client" />

import type { AppAPI } from '@/preload'
import type { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    api: AppAPI
    electron: ElectronAPI
  }
}

export {}
