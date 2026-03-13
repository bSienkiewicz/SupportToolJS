import React, { useState } from 'react'
import { Button } from '@/renderer/src/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/renderer/src/components/ui/sheet'
import { Label } from '@/renderer/src/components/ui/label'
import { Input } from '@/renderer/src/components/ui/input'

type LSToolHeaderProps = {
  login: string
  password: string
  onLoginChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onLoginBlur: (value: string) => void
  onPasswordBlur: (value: string) => void
}

const LSToolHeader = ({
  login,
  password,
  onLoginChange,
  onPasswordChange,
  onLoginBlur,
  onPasswordBlur,
}: LSToolHeaderProps) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <header className="border-b pb-4 px-4 flex flex-wrap justify-between items-center gap-3 shrink-0">
        <h1 className="text-xl font-bold">LS Tool</h1>
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
                  onChange={(e) => onLoginChange(e.target.value)}
                  onBlur={(e) => onLoginBlur(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ddo-client-secret">Client Secret</Label>
                <Input
                  id="ddo-client-secret"
                  type="password"
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  onBlur={(e) => onPasswordBlur(e.target.value)}
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