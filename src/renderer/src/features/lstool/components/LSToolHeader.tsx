import { useState } from 'react'
import { Button } from '@/renderer/src/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/renderer/src/components/ui/sheet'
import { Label } from '@/renderer/src/components/ui/label'
import { Input } from '@/renderer/src/components/ui/input'
import { useLSToolCredentials } from '../context/LSToolCredentialsContext'
import { ButtonGroup } from '@/renderer/src/components/ui/button-group'
import { LucideMailbox, LucideMapPin } from 'lucide-react'

type LSToolHeaderProps = {
  title?: string
  /** When provided, shows Postcode / Geolocation toggle for the Nearby page. */
  nearbySearchType?: 'geolocation' | 'postcode'
  onNearbySearchTypeChange?: (type: 'geolocation' | 'postcode') => void
}

const LSToolHeader = ({ title = 'LS Tool', nearbySearchType, onNearbySearchTypeChange }: LSToolHeaderProps) => {
  const { login, password, setLogin, setPassword, persistCredentials } = useLSToolCredentials()
  const [open, setOpen] = useState(false)
  const showSearchTypeToggle = nearbySearchType != null && onNearbySearchTypeChange != null

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
        <div className="flex items-center gap-2">
          {showSearchTypeToggle && (
            <ButtonGroup>
              <Button
                variant={nearbySearchType === 'geolocation' ? 'default' : 'outline'}
                size="sm"
                className="gap-2"
                onClick={() => onNearbySearchTypeChange('geolocation')}
              >
                <LucideMapPin />
                Geolocation
              </Button>
              <Button
                variant={nearbySearchType === 'postcode' ? 'default' : 'outline'}
                size="sm"
                className="gap-2"
                onClick={() => onNearbySearchTypeChange('postcode')}
              >
                <LucideMailbox />
                Postcode
              </Button>
            </ButtonGroup>
          )}
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
        </div>
      </header>
    </>
  )
}

export default LSToolHeader
