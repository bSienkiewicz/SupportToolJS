import React, { useState, useEffect } from 'react'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { toast } from 'sonner'
import { Separator } from './components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from './components/ui/dialog'

const API_KEY_PREFIX = 'NRAK-'
const API_KEY_LENGTH = 32

function isValidApiKey(key: string): boolean {
  return key.startsWith(API_KEY_PREFIX) && key.length === API_KEY_LENGTH
}

const SettingsPage = () => {
  const [dataDir, setDataDir] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [version, setVersion] = useState<string>('')
  const [checking, setChecking] = useState(false)
  const [updateInfo, setUpdateInfo] = useState<{
    latestVersion: string
    releaseUrl: string
    downloadUrl: string | null
  } | null>(null)
  const [releasesUrl, setReleasesUrl] = useState<string>('')
  const [resetSettingsOpen, setResetSettingsOpen] = useState(false)

  const load = (): void => {
    window.api.getDataDir().then(setDataDir)
    window.api.getConfig().then((c) => {
      setApiKey(c.apiKey ?? '')
    })
    window.api.getVersion().then(setVersion)
    window.api.getReleasesUrl().then(setReleasesUrl)
  }

  useEffect(() => {
    load()
  }, [])

  const pickDir = (): void => {
    window.api.pickDataDir().then((dir) => {
      if (dir) setDataDir(dir)
    })
  }

  const checkForUpdate = (): void => {
    setChecking(true)
    setUpdateInfo(null)
    window.api
      .checkForUpdate()
      .then((result) => {
        setChecking(false)
        if (result.error) {
          toast.error(result.error)
          return
        }
        if (result.updateAvailable && result.latestVersion && result.releaseUrl) {
          setUpdateInfo({
            latestVersion: result.latestVersion,
            releaseUrl: result.releaseUrl,
            downloadUrl: result.downloadUrl ?? null
          })
          const urlToOpen = result.downloadUrl ?? result.releaseUrl
          toast.info(`Update ${result.latestVersion} available`, {
            description: 'Download manually from the releases page.',
            action: {
              label: 'Download',
              onClick: () => void window.api.openUrl(urlToOpen)
            },
            duration: 10000
          })
        } else {
          toast.success("You're up to date")
        }
      })
      .catch(() => {
        setChecking(false)
        toast.error('Failed to check for updates')
      })
  }

  const openReleases = (): void => {
    const url = updateInfo?.releaseUrl ?? releasesUrl
    if (url) window.api.openUrl(url)
    else window.api.getReleasesUrl().then((u) => window.api.openUrl(u))
  }

  const openDownload = (): void => {
    if (updateInfo?.downloadUrl) {
      window.api.openUrl(updateInfo.downloadUrl)
    } else {
      openReleases()
    }
  }

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setApiKey(e.target.value)
  }

  const handleApiKeyBlur = (e: React.FocusEvent<HTMLInputElement>): void => {
    const apiKeyInput = e.target.value.trim()
    setApiKey(apiKeyInput)
    if (!apiKeyInput) return
    if (!isValidApiKey(apiKeyInput)) {
      toast.error(`Invalid API key`)
      return
    }
    window.api.getConfigValue('apiKey').then((prev) => {
      if (prev !== apiKeyInput) {
        void window.api.setConfigValue('apiKey', apiKeyInput)
        toast.success('API key updated')
      }
    })
  }

  const resetSettings = (): void => {
    window.api.resetSettings()
    toast.success('Settings reset')
    load()
    setResetSettingsOpen(false)
  }

  return (
    <div className="p-6 space-y-8">
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">About</h2>
        <p className="text-sm text-muted-foreground">Version {version || '…'}</p>
        <div className="flex flex-wrap gap-2 items-center">
          <Button variant="secondary" size="sm" onClick={checkForUpdate} disabled={checking}>
            {checking ? 'Checking…' : 'Check for updates'}
          </Button>
          <Button variant="link" size="sm" onClick={openReleases} className="text-muted-foreground">
            Releases
          </Button>
          {updateInfo && (
            <>
              <span className="text-sm text-muted-foreground">
                Update {updateInfo.latestVersion} available.
              </span>
              <Button size="sm" variant="default" onClick={openDownload}>
                Download
              </Button>
            </>
          )}
        </div>
      </section>
      <Separator />
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Data directory</h2>
        <p className="text-sm font-mono bg-muted px-2 py-1 rounded truncate">
          {dataDir ?? 'Not set'}
        </p>
        <Button onClick={pickDir}>Pick directory</Button>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">New Relic API Key</h2>
        <div className="flex gap-2 flex-wrap">
          <Input
            type="text"
            placeholder="NRAK-..."
            value={apiKey}
            onBlur={handleApiKeyBlur}
            onChange={handleApiKeyChange}
            className="border rounded px-2 py-1.5 text-sm w-full"
            aria-invalid={apiKey.length > 0 && !isValidApiKey(apiKey)}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Must start with NRAK- and be {API_KEY_LENGTH} characters long.
        </p>
      </section>
      <Separator />
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Reset settings</h2>
        <Dialog open={resetSettingsOpen} onOpenChange={setResetSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">Reset settings</Button>
          </DialogTrigger>
          <DialogContent showCloseButton={true}>
            <DialogHeader>
              <DialogTitle>Reset settings</DialogTitle>
              <DialogDescription>
                This will reset all settings to their default values.
              </DialogDescription>
              <DialogFooter>
                <Button variant="outline" onClick={() => setResetSettingsOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={resetSettings}>
                  Reset
                </Button>
              </DialogFooter>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </section>
    </div>
  )
}

export default SettingsPage
