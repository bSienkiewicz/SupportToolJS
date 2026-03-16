import React from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/renderer/src/components/ui/dialog'
import { Input } from '@/renderer/src/components/ui/input'
import type { Retailer } from '../types'

type RetailerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  retailers: Retailer[]
  filteredRetailers: Retailer[]
  search: string
  onSearchChange: (value: string) => void
  onSelectRetailer: (retailerId: string) => void
}

export function RetailerDialog({
  open,
  onOpenChange,
  retailers,
  filteredRetailers,
  search,
  onSearchChange,
  onSelectRetailer,
}: RetailerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select retailer</DialogTitle>
          <DialogDescription>
            Choose a retailer to search for nearby locations by postcode.
          </DialogDescription>
        </DialogHeader>
        <div className="h-[60vh] overflow-auto space-y-1 text-sm relative">
          <div className="mb-2 sticky top-0 z-10 bg-background">
            <Input
              placeholder="Search retailer by name or ID…"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          {filteredRetailers
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((r) => (
              <button
                key={r.id}
                type="button"
                className="w-full text-left px-3 py-2 rounded border hover:bg-accent hover:border-accent-foreground transition-colors"
                onClick={() => onSelectRetailer(r.id)}
              >
                <div className="font-semibold">{r.name}</div>
                <div className="text-xs text-muted-foreground break-all">
                  ID: {r.id}
                </div>
              </button>
            ))}
          {!retailers.length && (
            <div className="text-xs text-muted-foreground">
              No retailers loaded yet. Close and reopen if this persists.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
