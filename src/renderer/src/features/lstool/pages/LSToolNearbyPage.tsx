import { useCallback, useMemo, useState } from 'react'
import LSToolHeader from '../components/LSToolHeader'
import { useLSToolCredentials } from '../context/LSToolCredentialsContext'
import { Label } from '@/renderer/src/components/ui/label'
import { Button } from '@/renderer/src/components/ui/button'
import { Input } from '@/renderer/src/components/ui/input'
import { RetailerDialog } from '../components/RetailerDialog'
import { LocationsMapView } from '../components/LocationsMapView'
import { LocationsList } from '../components/LocationsList'
import { LocationDetailsDialog } from '../components/LocationDetailsDialog'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/renderer/src/components/ui/resizable'
import type { DdoLocation, OpeningTimesData, Retailer } from '../types'
import { toast } from 'sonner'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/renderer/src/components/ui/input-group'
import { LucideCopy, LucideSearch } from 'lucide-react'

const DEFAULT_RANGE = 1000

function getLocationSearchableString(loc: DdoLocation): string {
  const parts = [
    loc.storeName,
    loc.storeId,
    loc.address,
    loc.structuredAddress?.street,
    loc.structuredAddress?.city,
    loc.structuredAddress?.postCode,
    loc.structuredAddress?.countryCode,
    loc.city,
    loc.postCode,
    loc.countryCode,
  ]
  return parts.filter(Boolean).join(' ').toLowerCase()
}

const LSToolNearbyPage = () => {
  const { login, password } = useLSToolCredentials()
  const [accessToken, setAccessToken] = useState<string>('')
  const [retailers, setRetailers] = useState<Retailer[]>([])
  const [retailerId, setRetailerId] = useState<string>('')
  const [retailerDialogOpen, setRetailerDialogOpen] = useState(false)
  const [retailerSearch, setRetailerSearch] = useState('')
  const [searchType, setSearchType] = useState<'postcode' | 'geolocation'>('geolocation')
  const [countryCode, setCountryCode] = useState('')
  const [postcode, setPostcode] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [range, setRange] = useState(String(DEFAULT_RANGE))
  const [lastGeolocationSearch, setLastGeolocationSearch] = useState<{ lat: number; lng: number; radiusM: number } | null>(null)
  const [mapSelectedPoint, setMapSelectedPoint] = useState(false)
  const [locations, setLocations] = useState<DdoLocation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [listSearch, setListSearch] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<DdoLocation | null>(null)
  const [locationDialogOpen, setLocationDialogOpen] = useState(false)
  const [openingTimes, setOpeningTimes] = useState<Record<string, OpeningTimesData | undefined>>({})
  const [openingTimesLoading, setOpeningTimesLoading] = useState<Record<string, boolean>>({})
  const [openingTimesError, setOpeningTimesError] = useState<Record<string, string | null>>({})

  const requestToken = useCallback(async (): Promise<string> => {
    const credentials = btoa(`${login}:${password}`)
    const response = await fetch('https://ddo.metapack.com/oauth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({ grant_type: 'client_credentials' }),
    })
    if (!response.ok) {
      throw new Error(`OAuth request failed with status ${response.status}`)
    }
    const data = await response.json()
    const token = data.access_token as string | undefined
    if (!token) throw new Error('OAuth response missing access_token')
    setAccessToken(token)
    return token
  }, [login, password])

  const ensureTokenAndFetch = useCallback(
    async (path: string): Promise<unknown> => {
      let token = accessToken
      if (!token) token = await requestToken()
      const makeRequest = async (t: string) => {
        const res = await fetch(`https://ddo.metapack.com${path}`, {
          headers: { Authorization: `Bearer ${t}` },
        })
        if (res.status === 401) throw new Error('UNAUTHORIZED')
        if (res.status === 404) {
          const err = new Error('NOT_FOUND') as Error & { status?: number }
          err.status = 404
          throw err
        }
        if (!res.ok) throw new Error(`Request failed with status ${res.status}`)
        return res.json()
      }
      try {
        return await makeRequest(token)
      } catch (err) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
          const newToken = await requestToken()
          return await makeRequest(newToken)
        }
        throw err
      }
    },
    [accessToken, requestToken],
  )

  const loadRetailers = useCallback(async () => {
    if (!login || !password) {
      toast.error('Configure DDO credentials first')
      return
    }
    try {
      const data = await ensureTokenAndFetch('/retailers')
      setRetailers(Array.isArray(data) ? (data as Retailer[]) : [])
    } catch (err) {
      console.error('Failed to load retailers', err)
      toast.error('Failed to load retailers')
    }
  }, [login, password, ensureTokenAndFetch])

  const rangeNum = range.trim() === '' ? NaN : Number(range.trim())
  const isRangeValid = Number.isFinite(rangeNum) && rangeNum > 0
  const handleMapClick = useCallback((lat: number, lng: number) => {
    setLatitude(String(lat))
    setLongitude(String(lng))
    setMapSelectedPoint(true)
  }, [])

  const handleClearMapSelection = useCallback(() => {
    setLatitude('')
    setLongitude('')
    setMapSelectedPoint(false)
  }, [])

  const isSearchDisabled = useMemo(() => {
    if (!retailerId.trim()) return true
    if (!isRangeValid) return true
    if (searchType === 'postcode') {
      return !countryCode.trim() || !postcode.trim()
    }
    const lat = latitude.trim() === '' ? NaN : Number.parseFloat(latitude.trim())
    const lon = longitude.trim() === '' ? NaN : Number.parseFloat(longitude.trim())
    return !Number.isFinite(lat) || !Number.isFinite(lon)
  }, [retailerId, searchType, countryCode, postcode, latitude, longitude, isRangeValid])

  const handleSearch = useCallback(async () => {
    if (isSearchDisabled) return
    if (rangeNum > 50000) {
      toast.error('Range cannot be greater than 50000 meters')
      return
    }
    const radiusM = rangeNum
    setError(null)
    setIsLoading(true)
    setHasSearched(true)
    setLastGeolocationSearch(null)
    try {
      if (searchType === 'postcode') {
        const params = new URLSearchParams({
          ret: retailerId,
          radius: String(radiusM),
          postcode: postcode.trim(),
          countrycode: countryCode.trim(),
        })
        const data = await ensureTokenAndFetch(`/locations/?${params.toString()}`)
        setLocations(Array.isArray(data) ? (data as DdoLocation[]) : [])
      } else {
        const lat = Number.parseFloat(latitude.trim())
        const lon = Number.parseFloat(longitude.trim())
        const params = new URLSearchParams({
          ret: retailerId,
          radius: String(radiusM),
          lat: String(lat),
          lon: String(lon),
        })
        const data = await ensureTokenAndFetch(`/locations/?${params.toString()}`)
        setLocations(Array.isArray(data) ? (data as DdoLocation[]) : [])
        setLastGeolocationSearch({ lat, lng: lon, radiusM })
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch nearby locations'
      setError(message)
      setLocations([])
    } finally {
      setIsLoading(false)
    }
  }, [retailerId, searchType, countryCode, postcode, latitude, longitude, rangeNum, isSearchDisabled, ensureTokenAndFetch])

  const filteredRetailers = useMemo(() => {
    const term = retailerSearch.trim().toLowerCase()
    if (!term) return retailers
    return retailers.filter(
      (r) =>
        r.name.toLowerCase().includes(term) || r.id.toLowerCase().includes(term),
    )
  }, [retailers, retailerSearch])

  const selectedRetailer = retailers.find((r) => r.id === retailerId)

  const mapSearchOrigin = useMemo(
    () => (lastGeolocationSearch ? { lat: lastGeolocationSearch.lat, lng: lastGeolocationSearch.lng } : undefined),
    [lastGeolocationSearch?.lat, lastGeolocationSearch?.lng],
  )
  const placeholderOrigin = useMemo(() => {
    if (!mapSelectedPoint || !latitude.trim() || !longitude.trim()) return undefined
    const lat = Number.parseFloat(latitude.trim())
    const lng = Number.parseFloat(longitude.trim())
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined
    return { lat, lng }
  }, [mapSelectedPoint, latitude, longitude])

  const handleFetchOpeningTimes = useCallback(
    async (location: DdoLocation, href: string) => {
      const locId = String(location.id)
      setOpeningTimesLoading((prev) => ({ ...prev, [locId]: true }))
      setOpeningTimesError((prev) => ({ ...prev, [locId]: null }))
      try {
        const data = await ensureTokenAndFetch(href)
        setOpeningTimes((prev) => ({ ...prev, [locId]: data as OpeningTimesData }))
      } catch (err) {
        if (err instanceof Error && (err as Error & { message?: string }).message === 'NOT_FOUND') {
          const label = location.storeId ?? location.id
          setOpeningTimesError((prev) => ({
            ...prev,
            [locId]: `No opening times found for ${label}`,
          }))
        } else {
          const message =
            err instanceof Error ? err.message : 'Failed to load opening times'
          setOpeningTimesError((prev) => ({ ...prev, [locId]: message }))
        }
      } finally {
        setOpeningTimesLoading((prev) => ({ ...prev, [locId]: false }))
      }
    },
    [ensureTokenAndFetch],
  )

  const listSearchLower = listSearch.trim().toLowerCase()
  const filteredLocationsForList = useMemo(() => {
    if (!listSearchLower) return locations
    const searchable = locations.map(getLocationSearchableString)
    return locations.filter((_, i) => searchable[i]?.includes(listSearchLower))
  }, [locations, listSearchLower])

  return (
    <div className="flex flex-col h-full">
      <LSToolHeader
        title="Find Nearby Locations"
        nearbySearchType={searchType}
        onNearbySearchTypeChange={(type) => {
          setSearchType(type)
          if (type === 'postcode') setMapSelectedPoint(false)
        }}
      />
      <div className="p-4 flex flex-col gap-4 flex-1 min-h-0">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            <Label>Retailer</Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="justify-between flex-1 min-w-0"
                onClick={() => {
                  setRetailerDialogOpen(true)
                  if (!retailers.length) void loadRetailers()
                }}
              >
                <span className="truncate text-left">
                  {selectedRetailer
                    ? `${selectedRetailer.name} (${selectedRetailer.id})`
                    : retailerId
                      ? retailerId
                      : 'Select retailer'}
                </span>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (!retailerId) return
                  void navigator.clipboard.writeText(retailerId)
                  toast.success('Retailer ID copied')
                }}
                disabled={!retailerId}
              >
                <LucideCopy /> Copy retailer ID
              </Button>
            </div>
          </div>
          {searchType === 'postcode' ? (
            <>
              <div className="space-y-2 w-32">
                <Label>Country (ISO3)</Label>
                <Input
                  placeholder="e.g. POL"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value.toUpperCase().slice(0, 3))}
                  maxLength={3}
                />
              </div>
              <div className="space-y-2 w-40">
                <Label>Postcode</Label>
                <Input
                  placeholder="Postcode"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2 w-36">
                <Label>Latitude</Label>
                <Input
                  placeholder="e.g. 51.927766"
                  type="text"
                  inputMode="decimal"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                />
              </div>
              <div className="space-y-2 w-36">
                <Label>Longitude</Label>
                <Input
                  placeholder="e.g. 15.507537"
                  type="text"
                  inputMode="decimal"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                />
              </div>
            </>
          )}
          <div className="space-y-2 w-28">
            <Label>Range (m)</Label>
            <Input
              type="number"
              min={1}
              max={15000}
              placeholder="e.g. 1000"
              value={range}
              onChange={(e) => setRange(e.target.value)}
            />
          </div>
          <Button
            onClick={() => void handleSearch()}
            disabled={isSearchDisabled || isLoading}
          >
            <LucideSearch className="size-4 mr-1" />
            {isLoading ? 'Searching…' : 'Search'}
          </Button>
        </div>

        {error && (
          <div className="text-sm text-destructive">{error}</div>
        )}

        <div className="flex-1 min-h-0 flex flex-col">
          <ResizablePanelGroup className="flex-1 min-h-0">
            <ResizablePanel defaultSize={70} minSize={'50%'} maxSize={'70%'} className="min-h-0 overflow-hidden">
              <div className="h-full flex flex-col relative">
                <div className="flex-1 min-h-0 relative">
                  <LocationsMapView
                    locations={locations}
                    searchOrigin={mapSearchOrigin}
                    searchRadiusM={lastGeolocationSearch?.radiusM}
                    placeholderOrigin={placeholderOrigin}
                    onMapClick={searchType === 'geolocation' ? handleMapClick : undefined}
                  />
                  {searchType === 'geolocation' && (
                    <div className="absolute bottom-2 left-2 z-40 rounded-md bg-background/90 px-3 py-1 text-xs shadow">
                      Click on the map to select the coordinates
                    </div>
                  )}
                  {mapSelectedPoint && searchType === 'geolocation' && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="absolute top-2 right-2 z-50 shadow-md"
                      onClick={handleClearMapSelection}
                    >
                      Cancel selection
                    </Button>
                  )}
                </div>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={30} minSize={30} className="min-h-0 flex flex-col overflow-hidden pl-2">
              {locations.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4">
                  {hasSearched
                    ? 'No locations found. Try a different postcode or range.'
                    : 'Search for the location to display nearby points.'}
                </p>
              ) : (
                <>
                  <div className="sticky top-0 z-10 bg-background pb-2 shrink-0">
                    <InputGroup>
                      <InputGroupInput
                        placeholder="Search list by store, address, postcode…"
                        value={listSearch}
                        onChange={(e) => setListSearch(e.target.value)}
                      />
                      <InputGroupAddon>
                        <LucideSearch className="size-4" />
                      </InputGroupAddon>
                    </InputGroup>
                  </div>
                  <div className="flex-1 min-h-0 flex flex-col pt-2">
                    {filteredLocationsForList.length === 0 ? (
                      <p className="text-sm text-muted-foreground pl-2">
                        {listSearch.trim() ? 'No matches for this search.' : 'No locations.'}
                      </p>
                    ) : (
                      <LocationsList
                        locations={filteredLocationsForList}
                        openingTimes={openingTimes}
                        openingTimesLoading={openingTimesLoading}
                        openingTimesError={openingTimesError}
                        onSelectLocation={(loc) => {
                          setSelectedLocation(loc)
                          setLocationDialogOpen(true)
                        }}
                        onFetchOpeningTimes={handleFetchOpeningTimes}
                      />
                    )}
                  </div>
                </>
              )}
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>

      <RetailerDialog
        open={retailerDialogOpen}
        onOpenChange={setRetailerDialogOpen}
        retailers={retailers}
        filteredRetailers={filteredRetailers}
        search={retailerSearch}
        onSearchChange={setRetailerSearch}
        onSelectRetailer={(id) => {
          setRetailerId(id)
          setRetailerDialogOpen(false)
        }}
      />

      <LocationDetailsDialog
        open={locationDialogOpen}
        location={selectedLocation}
        onOpenChange={(open) => {
          setLocationDialogOpen(open)
          if (!open) setSelectedLocation(null)
        }}
        onFetchOpeningTimes={handleFetchOpeningTimes}
        openingTimes={selectedLocation ? openingTimes[String(selectedLocation.id)] : undefined}
        openingTimesLoading={selectedLocation ? openingTimesLoading[String(selectedLocation.id)] ?? false : false}
        openingTimesError={selectedLocation ? openingTimesError[String(selectedLocation.id)] ?? null : null}
      />
    </div>
  )
}

export default LSToolNearbyPage
