import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/renderer/src/components/ui/dialog'
import { Input } from '@/renderer/src/components/ui/input'
import type { LocationProvider } from '../types'

type ProviderDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  providers: LocationProvider[]
  filteredProviders: LocationProvider[]
  search: string
  onSearchChange: (value: string) => void
  onSelectProvider: (providerId: string) => void
}

export function ProviderDialog({
  open,
  onOpenChange,
  providers,
  filteredProviders,
  search,
  onSearchChange,
  onSelectProvider,
}: ProviderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select location provider</DialogTitle>
          <DialogDescription>
            Choose a location provider to load its countries and PUDO points.
          </DialogDescription>
        </DialogHeader>
        <div className="h-[60vh] overflow-auto space-y-1 text-sm relative">
          <div className="mb-2 sticky top-0 z-10 bg-background">
            <Input
              placeholder="Search provider by name or ID…"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          {filteredProviders
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((p) => (
            <button
              key={p.id}
              type="button"
              className="w-full text-left px-3 py-2 rounded border hover:bg-accent hover:border-accent-foreground transition-colors"
              onClick={() => onSelectProvider(p.id)}
            >
              <div className="font-semibold">{p.name}</div>
              <div className="text-xs text-muted-foreground break-all">
                ID: {p.id}
              </div>
              {p.archivingPeriod != null && (
                <div className="text-xs text-muted-foreground">
                  Archiving period: {p.archivingPeriod} days
                </div>
              )}
              {p.locationsSource?.endpoint && (
                <div className="text-xs text-muted-foreground truncate">
                  Endpoint: {p.locationsSource.endpoint}
                </div>
              )}
            </button>
          ))}
          {!providers.length && (
            <div className="text-xs text-muted-foreground">
              No providers loaded yet. Close and reopen if this persists.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

