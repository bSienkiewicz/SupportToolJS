import { Virtuoso } from 'react-virtuoso'
import { Label } from '@/renderer/src/components/ui/label'
import { Button } from '@/renderer/src/components/ui/button'
import type { DdoLocation, OpeningTimesData } from '../types'
import { toast } from 'sonner'
import { Badge } from '@/renderer/src/components/ui/badge'
import { LucideCopy, LucideFootprints, LucideHome, LucideMapPin, LucideTag, LucideVan } from 'lucide-react'

type LocationsListProps = {
  locations: DdoLocation[]
  openingTimes: Record<string, OpeningTimesData | undefined>
  openingTimesLoading: Record<string, boolean>
  openingTimesError: Record<string, string | null>
  onSelectLocation: (location: DdoLocation) => void
  onFetchOpeningTimes: (location: DdoLocation, href: string) => void
}

function LocationCard({
  loc,
  openingData,
  openingLoading,
  openingErr,
  onSelectLocation,
  onFetchOpeningTimes,
}: {
  loc: DdoLocation
  openingData: OpeningTimesData | undefined
  openingLoading: boolean
  openingErr: string | null
  onSelectLocation: (location: DdoLocation) => void
  onFetchOpeningTimes: (location: DdoLocation, href: string) => void
}) {
  const openingLink = Array.isArray(loc.links)
    ? loc.links.find((l: { rel: string }) => l.rel === 'openingTimesRules')
    : null
  const embeddedRules = (loc as { locationOpeningTimesRules?: { openingTimesRules?: OpeningTimesData['openingTimesRules'] } }).locationOpeningTimesRules?.openingTimesRules
  const effectiveOpeningData = openingData ?? (embeddedRules && embeddedRules.length > 0 ? { openingTimesRules: embeddedRules } : undefined)
  const showOpeningSection = openingLink != null || effectiveOpeningData != null

  return (
    <div
      className="mb-2 rounded border bg-white/5 p-3 text-sm space-y-2 cursor-pointer hover:bg-white/10 transition-colors relative"
      onClick={() => onSelectLocation(loc)}
    >
      <div className="font-semibold">
        {loc.storeName}{' '}
        {loc.storeId && (
          <span className="text-xs text-gray-500">({loc.storeId})</span>
        )}
      </div>
      <div className="text-xs text-gray-500 flex items-center gap-1">
        <LucideVan size={16} /> {loc.locationProvider?.name ?? loc.locationType ?? '—'}
      </div>
      <div className="text-xs text-gray-600 flex items-center gap-1">
        <LucideHome size={16} />
        {loc.structuredAddress?.street || loc.address}
        {(loc.structuredAddress?.city ?? loc.city) &&
          `, ${loc.structuredAddress?.city ?? loc.city}`}
        {(loc.structuredAddress?.postCode ?? loc.postCode) &&
          ` ${loc.structuredAddress?.postCode ?? loc.postCode}`}
        {(loc.structuredAddress?.countryCode ?? loc.countryCode) &&
          `, ${loc.structuredAddress?.countryCode ?? loc.countryCode}`}
      </div>
      {loc.distance && typeof loc.distance.value === 'number' && (
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <LucideFootprints size={16} /> {(loc.distance.value).toFixed(2)} m
        </div>
      )}
      {(loc.latitude != null || loc.longitude != null) && (
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <LucideMapPin size={16} /> {loc.latitude ?? '-'}, {loc.longitude ?? '-'}
        </div>
      )}
      {Array.isArray(loc.tags) && loc.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {loc.tags.map((tag: string) => (
            <Badge
              key={tag}
              variant="default"
              className="text-xs flex items-center gap-1"
            >
              <LucideTag />
              {tag}
            </Badge>
          ))}
        </div>
      )}
      <Button
        variant="outline"
        size="xs"
        className="absolute top-4 right-4"
        onClick={(e) => {
          e.stopPropagation()
          const text = JSON.stringify(loc, null, 2)
          void navigator.clipboard.writeText(text)
          toast.success('Location JSON copied')
        }}
      >
        <LucideCopy />
        Copy JSON
      </Button>
      {showOpeningSection && (
        <div className="mt-2 space-y-1">
          {!effectiveOpeningData && openingLink != null && (
            <Button
              variant="outline"
              size="xs"
              onClick={(e) => {
                e.stopPropagation()
                onFetchOpeningTimes(loc, openingLink.href)
              }}
              disabled={openingLoading}
            >
              {openingLoading ? 'Loading opening times…' : 'Show opening times'}
            </Button>
          )}
          {openingErr && (
            <div className="text-xs text-red-600">{openingErr}</div>
          )}
          {effectiveOpeningData && Array.isArray(effectiveOpeningData.openingTimesRules) && (
            <div className="text-xs space-y-0.5">
              {effectiveOpeningData.openingTimesRules.map((rule, idx) => (
                <div key={idx}>
                  <span className="font-semibold">{rule.rule}:</span>{' '}
                  {Array.isArray(rule.openingClosingTimes) &&
                    rule.openingClosingTimes
                      .map(
                        (t) => `${t.openingAt ?? ''}-${t.closingAt ?? ''}`,
                      )
                      .join(', ')}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function LocationsList({
  locations,
  openingTimes,
  openingTimesLoading,
  openingTimesError,
  onSelectLocation,
  onFetchOpeningTimes,
}: LocationsListProps) {
  if (!locations.length) return null

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <Label>Locations ({locations.length})</Label>
      <div className="mt-2 flex-1 min-h-0 min-w-0">
        <Virtuoso
          style={{ height: '100%' }}
          totalCount={locations.length}
          itemContent={(index) => {
            const loc = locations[index]
            const locId = String(loc.id)
            return (
              <LocationCard
                key={locId}
                loc={loc}
                openingData={openingTimes[locId]}
                openingLoading={openingTimesLoading[locId] ?? false}
                openingErr={openingTimesError[locId] ?? null}
                onSelectLocation={onSelectLocation}
                onFetchOpeningTimes={onFetchOpeningTimes}
              />
            )
          }}
        />
      </div>
    </div>
  )
}

