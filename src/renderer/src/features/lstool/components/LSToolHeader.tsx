import React, { useState } from 'react'
import { Button } from '@/renderer/src/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/renderer/src/components/ui/sheet'
import { Label } from '@/renderer/src/components/ui/label'
import { Input } from '@/renderer/src/components/ui/input'
import { useLSToolCredentials } from '../context/LSToolCredentialsContext'

const LSToolHeader = ({ title }: { title: string }) => {
  const { login, password, setLogin, setPassword, persistCredentials } = useLSToolCredentials()
  const [open, setOpen] = useState(false)

  const handleLoginBlur = (value: string) => {
    setLogin(value)
    void persistCredentials(value, password)
  }

  const handlePasswordBlur = (value: string) => {
    setPassword(value)
    void persistCredentials(login, value)
  }

  return (
    <>
      <header className="border-b pb-4 px-4 flex flex-wrap justify-between items-center gap-3 shrink-0">
        <h1 className="text-xl font-bold">{title}</h1>
        <Sheet open={open} onOpenChange={setOpen}>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setOpen(true)}
          >
            Configure credentials
          </Button>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>DDO credentials</SheetTitle>
              <SheetDescription>
                These credentials are stored in the app config and used to authenticate with the DDO API.
              </SheetDescription>
            </SheetHeader>
            <div className="p-4 flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="ddo-client-id">Client ID</Label>
                <Input
                  id="ddo-client-id"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  onBlur={(e) => handleLoginBlur(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ddo-client-secret">Client Secret</Label>
                <Input
                  id="ddo-client-secret"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={(e) => handlePasswordBlur(e.target.value)}
                  autoComplete="off"
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </header>
    </>
  )
}

export default LSToolHeader
