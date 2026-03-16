import React, { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/renderer/src/components/ui/dialog'
import { Label } from '@/renderer/src/components/ui/label'
import { Button } from '@/renderer/src/components/ui/button'
import type { DdoLocation } from '../types'
import { toast } from 'sonner'
import { CodeEditor } from '@/renderer/src/components/CodeEditor'
import { Badge } from '@/renderer/src/components/ui/badge'
import { LucideCopy, LucideTag } from 'lucide-react'
import { LocationMap } from './LocationMap'

type LocationDetailsDialogProps = {
  open: boolean
  location: DdoLocation | null
  onOpenChange: (open: boolean) => void
}

const CopyParameterButton = ({parameter, value}: {parameter: string, value: string}) => {
  return (
    <Button
      variant="ghost"
      className="justify-between flex-1 flex group"
      size="xs"
      onClick={() => {
        void navigator.clipboard.writeText(value)
        toast.success(`${parameter} copied`)
      }}
    >
      <span className='font-semibold'>{parameter}:</span> <span className='truncate'>{value}</span>
      <LucideCopy className='opacity-0 group-hover:opacity-100 transition-opacity' />
    </Button>
  )
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
          <DialogTitle>{location?.storeName} ({location?.storeId})</DialogTitle>
          <DialogDescription>
            {location?.locationProvider && (
              <span>Location Provider: {location.locationProvider.name} ({location.locationProvider.id})</span>
            )}
          </DialogDescription>
        </DialogHeader>
        {location && (
          <div className="space-y-4 text-sm max-h-[70vh] overflow-auto w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div>
                  <CopyParameterButton parameter="Store name" value={location.storeName ?? '—'} />
                </div>
                <div>
                  <CopyParameterButton parameter="Store ID" value={location.storeId ?? '—'} />
                </div>
                <div>
                  <CopyParameterButton parameter="Location ID" value={location.id ?? '—'} />
                </div>
                {(location.latitude != null || location.longitude != null) && (
                  <div>
                    <CopyParameterButton parameter="Coordinates" value={`${location.latitude ?? '-'}, ${location.longitude ?? '-'}`} />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <div>
                  <CopyParameterButton
                    parameter="Address"
                    value={
                      [
                        location.structuredAddress?.street || location.address,
                        location.structuredAddress?.city ?? location.city,
                        location.structuredAddress?.postCode ?? location.postCode,
                        location.structuredAddress?.countryCode ?? location.countryCode,
                      ]
                        .filter(Boolean)
                        .join(', ') || '—'
                    }
                  />
                </div>
                <div className="space-y-1">
                  <CopyParameterButton parameter="Location type" value={location.locationType ?? '—'} />
                </div>
                <div className="space-y-1">
                  <CopyParameterButton parameter="Cash on delivery" value={location.cashOnDelivery ? 'Yes' : 'No'} />
                </div>
                <div className="space-y-1">
                  <CopyParameterButton parameter="Drop off" value={location.dropOff ? 'Yes' : 'No'} />
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
              <div className="mt-2 shrink-0">
                {open &&
                  location.latitude != null &&
                  location.longitude != null && (
                    <LocationMap
                      key={location.id}
                      center={[location.latitude, location.longitude]}
                      zoom={13}
                      popupContent={
                        location.storeName ?? location.address ?? 'Location'
                      }
                    />
                  )}
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

