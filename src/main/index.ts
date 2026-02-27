import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join, resolve } from 'path'
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  statSync,
  readdirSync,
} from 'fs'
import { readFile, readdir } from 'fs/promises'
import { execSync, spawnSync } from 'child_process'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import {
  parseNrNrqlAlerts,
  replaceNrNrqlAlerts,
  getBlockRange,
  type NrAlert,
} from './nrAlertsHcl'
import {
  getApiKey,
  buildNrqlGraphQLQuery,
  executeGraphQLQuery,
  extractResultsArray,
  type NrqlResponse,
} from './newRelicHelper'
const APP_DATA_FILE = 'app-data.json'

interface WindowBounds {
  width: number
  height: number
  x?: number
  y?: number
}

interface AppData {
  config?: Record<string, string>
  windowBounds?: WindowBounds
}

function getDataDir(): string | null {
  return readAppData().config?.dataDir ?? null
}

function getAppDataPath(): string {
  return join(app.getPath('userData'), APP_DATA_FILE)
}

function readAppData(): AppData {
  const path = getAppDataPath()
  if (!existsSync(path)) return {}
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as AppData
  } catch {
    return {}
  }
}

function writeAppData(data: AppData): void {
  const dir = app.getPath('userData')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(getAppDataPath(), JSON.stringify(data, null, 2), 'utf-8')
}

const DEFAULT_WINDOW_WIDTH = 900
const DEFAULT_WINDOW_HEIGHT = 670

function createWindow(): void {
  const bounds = readAppData().windowBounds
  const width = bounds?.width ?? DEFAULT_WINDOW_WIDTH
  const height = bounds?.height ?? DEFAULT_WINDOW_HEIGHT
  const x = bounds?.x
  const y = bounds?.y

  const win = new BrowserWindow({
    width,
    height,
    ...(x != null && y != null ? { x, y } : {}),
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  win.on('close', () => {
    const b = win.getBounds()
    const data = readAppData()
    writeAppData({
      ...data,
      windowBounds: { width: b.width, height: b.height, x: b.x, y: b.y }
    })
  })

  win.on('ready-to-show', () => {
    win.show()
  })

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC handlers

  // App version (for display and update checks)
  ipcMain.handle('app:getVersion', () => app.getVersion())

  ipcMain.handle('app:getPlatform', () => process.platform)

  // Get data directory
  ipcMain.handle('app:getDataDir', () => getDataDir())

  // Git repo info for data directory (branch when repo, else just path)
  ipcMain.handle('app:getGitRepoInfo', (): { branch: string | null; dataDir: string | null } => {
    const dataDir = getDataDir()
    if (!dataDir) return { branch: null, dataDir: null }
    const gitDir = join(dataDir, '.git')
    if (!existsSync(gitDir) || !statSync(gitDir, { throwIfNoEntry: false })?.isDirectory()) {
      return { branch: null, dataDir }
    }
    try {
      const branch = execSync('git rev-parse --abbrev-ref HEAD', {
        encoding: 'utf-8',
        cwd: dataDir,
      }).trim()
      return { branch: branch || null, dataDir }
    } catch {
      return { branch: null, dataDir }
    }
  })

  // Git branches list (local) and current branch
  ipcMain.handle('app:getGitBranches', (): { branches: string[]; current: string | null } => {
    const dataDir = getDataDir()
    if (!dataDir) return { branches: [], current: null }
    const gitDir = join(dataDir, '.git')
    if (!existsSync(gitDir) || !statSync(gitDir, { throwIfNoEntry: false })?.isDirectory()) {
      return { branches: [], current: null }
    }
    try {
      const r = spawnSync(
        'git',
        ['for-each-ref', '--format=%(refname:short)', 'refs/heads'],
        { encoding: 'utf-8', cwd: dataDir }
      )
      if (r.status !== 0) return { branches: [], current: null }
      const branches = (r.stdout ?? '').split('\n').map((s) => s.trim()).filter(Boolean)
      const currentR = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
        encoding: 'utf-8',
        cwd: dataDir,
      })
      const current = currentR.status === 0 ? (currentR.stdout ?? '').trim() || null : null
      return { branches, current }
    } catch {
      return { branches: [], current: null }
    }
  })

  // Git checkout branch
  ipcMain.handle('app:gitCheckout', async (_e, branch: string): Promise<{ ok: boolean; error: string | null }> => {
    const dataDir = getDataDir()
    if (!dataDir) return { ok: false, error: 'No data directory' }
    const r = spawnSync('git', ['checkout', branch], { encoding: 'utf-8', cwd: dataDir })
    if (r.status !== 0) {
      return { ok: false, error: r.stderr?.trim() || r.error?.message || 'Checkout failed' }
    }
    return { ok: true, error: null }
  })

  // Git create branch and checkout
  ipcMain.handle(
    'app:gitCreateBranch',
    async (_e, newName: string, fromBranch: string): Promise<{ ok: boolean; error: string | null }> => {
      const dataDir = getDataDir()
      if (!dataDir) return { ok: false, error: 'No data directory' }
      const r = spawnSync('git', ['checkout', '-b', newName, fromBranch], {
        encoding: 'utf-8',
        cwd: dataDir,
      })
      if (r.status !== 0) {
        return { ok: false, error: r.stderr?.trim() || r.error?.message || 'Create branch failed' }
      }
      return { ok: true, error: null }
    }
  )

  // Git pull
  ipcMain.handle('app:gitPull', async (): Promise<{ ok: boolean; error: string | null }> => {
    const dataDir = getDataDir()
    if (!dataDir) return { ok: false, error: 'No data directory' }
    const r = spawnSync('git', ['pull'], { encoding: 'utf-8', cwd: dataDir })
    if (r.status !== 0) {
      return { ok: false, error: r.stderr?.trim() || r.error?.message || 'Pull failed' }
    }
    return { ok: true, error: null }
  })

  // Git uncommitted changes (working tree vs HEAD)
  ipcMain.handle(
    'app:getGitUncommittedChanges',
    (): { files: { path: string; fullPath: string; added: number; deleted: number; status: string }[] } => {
      const dataDir = getDataDir()
      if (!dataDir) return { files: [] }
      const gitDir = join(dataDir, '.git')
      if (!existsSync(gitDir) || !statSync(gitDir, { throwIfNoEntry: false })?.isDirectory()) {
        return { files: [] }
      }
      const statusR = spawnSync('git', ['status', '--porcelain'], {
        encoding: 'utf-8',
        cwd: dataDir,
      })
      if (statusR.status !== 0) return { files: [] }
      const statusOut = (statusR.stdout ?? '').trim()
      const files: { path: string; fullPath: string; added: number; deleted: number; status: string }[] = []
      const seen = new Set<string>()
      for (const line of statusOut.split('\n')) {
        if (line.length < 3) continue
        const xy = line.slice(0, 2).trim()
        let path = line.slice(2).trimStart().replace(/\\/g, '/')
        if (path.includes(' -> ')) path = path.split(' -> ')[1]?.trim() ?? path
        if (!path || seen.has(path)) continue
        seen.add(path)
        const fullPath = resolve(dataDir, path)
        files.push({
          path,
          fullPath,
          added: 0,
          deleted: 0,
          status: xy,
        })
      }
      return { files }
    }
  )

  // Git discard all uncommitted changes (reset --hard HEAD)
  ipcMain.handle('app:gitDiscardAll', async (): Promise<{ ok: boolean; error: string | null }> => {
    const dataDir = getDataDir()
    if (!dataDir) return { ok: false, error: 'No data directory' }
    const r = spawnSync('git', ['reset', '--hard', 'HEAD'], { encoding: 'utf-8', cwd: dataDir })
    if (r.status !== 0) {
      return { ok: false, error: r.stderr?.trim() || r.error?.message || 'Discard failed' }
    }
    return { ok: true, error: null }
  })

  // Git discard one file (restore from HEAD)
  ipcMain.handle(
    'app:gitDiscardFile',
    async (_e, path: string): Promise<{ ok: boolean; error: string | null }> => {
      const dataDir = getDataDir()
      if (!dataDir) return { ok: false, error: 'No data directory' }
      if (!path || typeof path !== 'string') return { ok: false, error: 'Invalid path' }
      const r = spawnSync('git', ['checkout', '--', path], { encoding: 'utf-8', cwd: dataDir })
      if (r.status !== 0) {
        return { ok: false, error: r.stderr?.trim() || r.error?.message || 'Discard failed' }
      }
      return { ok: true, error: null }
    }
  )

  // Pick data directory
  ipcMain.handle('app:pickDataDir', async () => {
    const requiredDirs = ['.git', 'ansible', 'metaform']
    const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
    const { canceled, filePaths } = await dialog.showOpenDialog(win ?? undefined, {
      properties: ['openDirectory']
    })
    if (canceled || filePaths.length === 0) return null
    const dir = filePaths[0]
    const missing = requiredDirs.filter((d) => {
      const p = join(dir, d)
      const stat = statSync(p, { throwIfNoEntry: false })
      return !stat?.isDirectory()
    })
    if (missing.length > 0) {
      dialog.showErrorBox(
        'Invalid directory',
        'Please pick the root directory of the devops-infrastructure repository'
      )
      return null
    }
    const data = readAppData()
    if (!data.config) data.config = {}
    data.config.dataDir = dir
    writeAppData(data)
    return dir
  })

  // Get config
  ipcMain.handle('app:getConfig', () => readAppData().config ?? {})
  ipcMain.handle('app:getConfigValue', (_e, key: string) => readAppData().config?.[key] ?? null)

  // Set config value
  ipcMain.handle('app:setConfigValue', (_e, key: string, value: string) => {
    const data = readAppData()
    if (!data.config) data.config = {}
    data.config[key] = value
    writeAppData(data)
  })

  // Get NR stacks
  const STACKS_PATH = 'metaform/mpm/copies/production/prd/eu-west-1'

  /** In-memory cache: stack name -> alerts. Filled by loadAllAlerts, read by getNRAlertsForStack, updated on save. */
  const alertsCache = new Map<string, NrAlert[]>()

  ipcMain.handle(
    'app:loadAllAlerts',
    async (): Promise<{ ok: boolean; stacksLoaded?: number; error?: 'no_data_dir' }> => {
      const dataDir = getDataDir()
      if (!dataDir) return { ok: false, error: 'no_data_dir' }
      const stacksDir = join(dataDir, STACKS_PATH)
      let dirs: string[]
      try {
        const entries = await readdir(stacksDir, { withFileTypes: true })
        dirs = entries.filter((d) => d.isDirectory()).map((d) => d.name)
      } catch {
        return { ok: true, stacksLoaded: 0 }
      }
      alertsCache.clear()
      let loaded = 0
      for (const stack of dirs) {
        const filePath = join(dataDir, STACKS_PATH, stack, 'auto.tfvars')
        try {
          const content = await readFile(filePath, 'utf-8')
          const parsed = parseNrNrqlAlerts(content)
          alertsCache.set(stack, parsed ? parsed.alerts : [])
        } catch {
          alertsCache.set(stack, [])
        }
        loaded++
      }
      return { ok: true, stacksLoaded: loaded }
    }
  )

  ipcMain.handle('app:getAlertsCache', () => alertsCache)

  ipcMain.handle(
    'app:searchAlertsCache',
    (_e, query: string): { results: { stack: string; alerts: NrAlert[] }[] } => {
      const searchLower = (query ?? '').trim().toLowerCase()
      if (!searchLower) return { results: [] }
      const results: { stack: string; alerts: NrAlert[] }[] = []
      for (const [stack, alerts] of alertsCache.entries()) {
        const filtered = (alerts ?? []).filter((a) =>
          (a.name ?? '').toLowerCase().includes(searchLower)
        )
        if (filtered.length > 0) results.push({ stack, alerts: filtered })
      }
      return { results }
    }
  )

  ipcMain.handle('app:getNRStacks', () => {
    const dataDir = getDataDir()
    if (!dataDir) return []
    const stacksDir = join(dataDir, STACKS_PATH)
    if (!existsSync(stacksDir)) return []
    return readdirSync(stacksDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
  })

  // Get NR alerts for stack from cache only (no file read)
  ipcMain.handle('app:getNRAlertsForStack', (_e, stack: string) => {
    const dataDir = getDataDir()
    if (!dataDir)
      return { alerts: [], error: 'no_data_dir' as const }
    if (!alertsCache.has(stack))
      return { alerts: [], error: 'cache_not_loaded' as const }
    return { alerts: alertsCache.get(stack) ?? [], error: null }
  })

  ipcMain.handle(
    'app:saveNRAlertsForStack',
    (_e, stack: string, alerts: NrAlert[]) => {
      const dataDir = getDataDir()
      if (!dataDir) return { ok: false, error: 'no_data_dir' as const }
      const filePath = join(dataDir, STACKS_PATH, stack, 'auto.tfvars')
      if (!existsSync(filePath)) return { ok: false, error: 'file_not_found' as const }
      let content: string
      try {
        content = readFileSync(filePath, 'utf-8')
      } catch (err) {
        return { ok: false, error: 'file_not_found' as const }
      }
      const range = getBlockRange(content)
      if (!range) return { ok: false, error: 'block_not_found' as const }
      let newContent = replaceNrNrqlAlerts(
        content,
        alerts,
        range.start,
        range.end
      )
      // Avoid accumulating trailing newlines: normalize to exactly one at end of file.
      newContent = newContent.replace(/\n+$/, '\n')
      try {
        writeFileSync(filePath, newContent, 'utf-8')
      } catch {
        return { ok: false, error: 'write_failed' as const }
      }
      alertsCache.set(stack, alerts)
      return { ok: true }
    }
  )

  // Execute NRQL via New Relic GraphQL API; returns results array or error.
  ipcMain.handle(
    'app:executeNrql',
    async (_e, nrqlQuery: string): Promise<{ data: unknown[] | null; error: string | null }> => {
      try {
        const config = readAppData().config
        const apiKey = getApiKey(config)
        const graphqlQuery = buildNrqlGraphQLQuery(nrqlQuery)
        const response = await executeGraphQLQuery<NrqlResponse>(graphqlQuery, apiKey)
        const results = extractResultsArray(response)
        return { data: results, error: null }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return { data: null, error: message }
      }
    }
  )

  // Manual update check: fetch GitHub latest release and compare versions. No auto-download.
  const GITHUB_RELEASES_API =
    'https://api.github.com/repos/bSienkiewicz/SupportToolJS/releases/latest'
  const GITHUB_RELEASES_PAGE = 'https://github.com/bSienkiewicz/SupportToolJS/releases'

  function parseVersion(s: string): number[] {
    const v = s.replace(/^v/, '').trim()
    return v.split('.').map((n) => parseInt(n, 10) || 0)
  }
  function isNewerVersion(latest: string, current: string): boolean {
    const a = parseVersion(latest)
    const b = parseVersion(current)
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const x = a[i] ?? 0
      const y = b[i] ?? 0
      if (x > y) return true
      if (x < y) return false
    }
    return false
  }
  function pickDownloadUrl(assets: { name: string; browser_download_url: string }[]): string | null {
    const platform = process.platform
    const arch = process.arch
    const isMac = platform === 'darwin'
    const isWin = platform === 'win32'
    if (isMac) {
      const preferArm = arch === 'arm64'
      const macZip = assets.find(
        (a) =>
          a.name.includes('mac') &&
          (a.name.endsWith('.zip') || a.name.endsWith('.dmg'))
      )
      const armZip = assets.find((a) => a.name.includes('arm64') && a.name.includes('mac'))
      const x64Zip = assets.find((a) => a.name.includes('x64') && a.name.includes('mac'))
      if (preferArm && armZip) return armZip.browser_download_url
      if (!preferArm && x64Zip) return x64Zip.browser_download_url
      return macZip?.browser_download_url ?? null
    }
    if (isWin) {
      const exe = assets.find((a) => a.name.endsWith('.exe'))
      return exe?.browser_download_url ?? null
    }
    const linux = assets.find(
      (a) =>
        a.name.includes('linux') &&
        (a.name.endsWith('.AppImage') || a.name.endsWith('.deb'))
    )
    return linux?.browser_download_url ?? null
  }

  ipcMain.handle(
    'app:checkForUpdate',
    async (): Promise<{
      updateAvailable: boolean
      currentVersion: string
      latestVersion?: string
      releaseUrl?: string
      downloadUrl?: string | null
      error?: string
    }> => {
      const currentVersion = app.getVersion()
      try {
        const res = await fetch(GITHUB_RELEASES_API, {
          headers: { Accept: 'application/vnd.github.v3+json' }
        })
        if (!res.ok) {
          return {
            updateAvailable: false,
            currentVersion,
            error: `GitHub API: ${res.status}`
          }
        }
        const data = (await res.json()) as {
          tag_name?: string
          html_url?: string
          assets?: { name: string; browser_download_url: string }[]
        }
        const latestVersion = data.tag_name?.replace(/^v/, '').trim()
        if (!latestVersion) {
          return { updateAvailable: false, currentVersion, error: 'No tag_name' }
        }
        const updateAvailable = isNewerVersion(latestVersion, currentVersion)
        const releaseUrl = data.html_url ?? GITHUB_RELEASES_PAGE
        const downloadUrl = data.assets?.length
          ? pickDownloadUrl(data.assets)
          : null
        return {
          updateAvailable,
          currentVersion,
          latestVersion,
          releaseUrl,
          downloadUrl,
          ...(updateAvailable && data.assets?.length ? {} : {})
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return {
          updateAvailable: false,
          currentVersion,
          error: message
        }
      }
    }
  )
  ipcMain.handle('app:openUrl', (_e, url: string) => {
    if (typeof url === 'string' && url.startsWith('http')) shell.openExternal(url)
  })
  ipcMain.handle('app:getReleasesUrl', () => GITHUB_RELEASES_PAGE)

  ipcMain.handle('app:resetSettings', () => {
    const data = readAppData()
    data.config = {}
    writeAppData(data)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
