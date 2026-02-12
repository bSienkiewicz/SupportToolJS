import React, { useState, useEffect } from 'react'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { toast } from 'sonner'

const SettingsPage = () => {
    const [dataDir, setDataDir] = useState<string | null>(null)
    const [apiKey, setApiKey] = useState('')

    const load = (): void => {
        window.api.getDataDir().then(setDataDir)
        window.api.getConfig().then((c) => {
            setApiKey(c.apiKey ?? '')
        })
    }

    useEffect(() => {
        load()
    }, [])

    const pickDir = (): void => {
        window.api.pickDataDir().then((dir) => {
            if (dir) setDataDir(dir)
        })
    }

    const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setApiKey(e.target.value)
    }

    const handleApiKeyBlur = (e: React.FocusEvent<HTMLInputElement>): void => {
        const apiKeyInput = e.target.value.trim()
        setApiKey(apiKeyInput)
        window.api.getConfigValue('apiKey').then((prev) => {
            if (prev !== apiKeyInput) {
                void window.api.setConfigValue('apiKey', apiKeyInput)
                toast.success('API key updated')
            }
        })
    }

    return (
        <div className="p-6 space-y-8">
            <section className="space-y-2">
                <h2 className="text-sm font-medium text-muted-foreground">Data directory</h2>
                <p className="text-sm font-mono bg-muted px-2 py-1 rounded truncate">
                    {dataDir ?? 'Not set'}
                </p>
                <Button onClick={pickDir}>Pick directory</Button>
            </section>

            <section className="space-y-2">
                <h2 className="text-sm font-medium text-muted-foreground">API Key</h2>
                <div className="flex gap-2 flex-wrap">
                    <Input
                        type="text"
                        placeholder="API key"
                        value={apiKey}
                        onBlur={handleApiKeyBlur}
                        onChange={handleApiKeyChange}
                        className="border rounded px-2 py-1.5 text-sm w-64"
                    />
                </div>
            </section>
        </div>
    )
}

export default SettingsPage