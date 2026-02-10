import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

const APP_DATA_FILE = 'app-data.json'

interface AppData {
  dataDir?: string
  config?: Record<string, string>
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

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
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

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
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

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.handle('app:getDataDir', () => readAppData().dataDir ?? null)
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
    data.dataDir = dir
    writeAppData(data)
    return dir
  })
  ipcMain.handle('app:getConfig', () => readAppData().config ?? {})
  ipcMain.handle('app:getConfigValue', (_e, key: string) => readAppData().config?.[key] ?? null)
  ipcMain.handle('app:setConfigValue', (_e, key: string, value: string) => {
    const data = readAppData()
    if (!data.config) data.config = {}
    data.config[key] = value
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
