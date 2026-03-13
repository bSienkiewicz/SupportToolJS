import React, { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/renderer/src/components/ui/dialog'
import { Label } from '@/renderer/src/components/ui/label'
import { Button } from '@/renderer/src/components/ui/button'
import type { DdoLocation } from '../types'
import { toast } from 'sonner'
import { CodeEditor } from '@/renderer/src/components/CodeEditor'
import { Badge } from '@/renderer/src/components/ui/badge'
import { LucideTag } from 'lucide-react'

type LocationDetailsDialogProps = {
  open: boolean
  location: DdoLocation | null
  onOpenChange: (open: boolean) => void
}

export function LocationDetailsDialog({
  open,
  location,
  onOpenChange,
}: LocationDetailsDialogProps) {
  const [showRawJson, setShowRawJson] = useState(false)
  const rawJson = useMemo(
    () => (location ? JSON.stringify(location, null, 2) : ''),
    [location],
  )

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent showCloseButton className="min-w-3xl max-w-5xl">
        <DialogHeader>
          <DialogTitle>{location?.storeName ?? 'Location details'}</DialogTitle>
          <DialogDescription>
            {location?.storeId && (
              <span>Store ID: {location.storeId} · </span>
            )}
            {location?.id && <span>Location ID: {location.id}</span>}
          </DialogDescription>
        </DialogHeader>
        {location && (
          <div className="space-y-4 text-sm max-h-[70vh] overflow-auto w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div>
                  <span className="font-semibold">Store name:</span>{' '}
                  {location.storeName ?? '—'}
                </div>
                <div>
                  <span className="font-semibold">Store ID:</span>{' '}
                  {location.storeId ?? '—'}
                </div>
                <div>
                  <span className="font-semibold">Location ID:</span>{' '}
                  {location.id}
                </div>
                {(location.latitude != null || location.longitude != null) && (
                  <div>
                    <span className="font-semibold">Coordinates:</span>{' '}
                    {location.latitude ?? '-'}, {location.longitude ?? '-'}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <div>
                  <span className="font-semibold">Address:</span>{' '}
                  {location.structuredAddress?.street || location.address}
                  {(location.structuredAddress?.city ?? location.city) &&
                    `, ${location.structuredAddress?.city ?? location.city}`}
                  {(location.structuredAddress?.postCode ?? location.postCode) &&
                    ` ${location.structuredAddress?.postCode ?? location.postCode}`}
                  {(location.structuredAddress?.countryCode ?? location.countryCode) &&
                    `, ${location.structuredAddress?.countryCode ?? location.countryCode}`}
                </div>
                <div className="space-y-1">
                <span className="font-semibold">Location type:</span>{' '}
                {location.locationType ?? '—'}
              </div>
              <div className="space-y-1">
                <span className="font-semibold">Cash on delivery:</span>{' '}
                {location.cashOnDelivery ? 'Yes' : 'No'}
              </div>
              <div className="space-y-1">
                <span className="font-semibold">Drop off:</span>{' '}
                {location.dropOff ? 'Yes' : 'No'}
              </div>
              </div>
            </div>

            {Array.isArray(location.tags) && location.tags.length > 0 && (
              <div className="mt-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {location.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="default"
                      className='text-xs flex items-center gap-1'
                    >
                      <LucideTag />
                      {tag}
                    </Badge>
                    ))}
                </div>
              </div>
            )}

            <div className="mt-2">
              <Label>Map</Label>
              <div className="mt-2 h-56 w-full rounded-md border border-dashed border-muted-foreground/40 bg-muted/40 flex items-center justify-center text-xs text-muted-foreground">
                Map preview will appear here for the selected coordinates.
              </div>
            </div>

            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between">
                <Label>Raw JSON</Label>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setShowRawJson((prev) => !prev)}
                >
                  {showRawJson ? 'Hide raw JSON' : 'Show raw JSON'}
                </Button>
              </div>
              {showRawJson && (
                <div className="relative">
                  <CodeEditor
                    value={rawJson}
                    onChange={() => { }}
                    language="json"
                    readOnly
                    minHeight="12rem"
                  />
                  <Button
                    variant="outline"
                    size="xs"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      if (!rawJson) return
                      void navigator.clipboard.writeText(rawJson)
                      toast.success('Location JSON copied')
                    }}
                  >
                    Copy
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

