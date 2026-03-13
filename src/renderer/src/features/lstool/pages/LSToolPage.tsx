import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import LSToolHeader from '../components/LSToolHeader'
import { Label } from '@/renderer/src/components/ui/label'
import { Button } from '@/renderer/src/components/ui/button'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/renderer/src/components/ui/select'
import { useFooter } from '@/renderer/src/context/FooterContext'
import { toast } from 'sonner'
import { Spinner } from '@/renderer/src/components/ui/spinner'
import { ProviderDialog } from '../components/ProviderDialog'
import { LocationsList } from '../components/LocationsList'
import { LocationDetailsDialog } from '../components/LocationDetailsDialog'
import type {
  CountrySummary,
  DdoLocation,
  LocationProvider,
  OpeningTimesData,
} from '../types'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/renderer/src/components/ui/input-group'
import { LucideCopy, LucideSearch } from 'lucide-react'

const SEARCH_DEBOUNCE_MS = 200

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

const LSToolPage = () => {
  const { setFooter } = useFooter()
  const [login, setLogin] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [accessToken, setAccessToken] = useState<string>('')
  const [locationProviderId, setLocationProviderId] = useState<string>('')
  const [locations, setLocations] = useState<DdoLocation[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState<string>('')
  const [openingTimes, setOpeningTimes] = useState<Record<string, OpeningTimesData | undefined>>({})
  const [openingTimesLoading, setOpeningTimesLoading] = useState<Record<string, boolean>>({})
  const [openingTimesError, setOpeningTimesError] = useState<Record<string, string | null>>({})
  const [selectedLocation, setSelectedLocation] = useState<DdoLocation | null>(null)
  const [locationDialogOpen, setLocationDialogOpen] = useState(false)
  const [providers, setProviders] = useState<LocationProvider[]>([])
  const [providerDialogOpen, setProviderDialogOpen] = useState(false)
  const [providerSearch, setProviderSearch] = useState<string>('')
  const [countries, setCountries] = useState<CountrySummary[]>([])
  const [selectedCountry, setSelectedCountry] = useState<string>('all')
  const [searchDebounced, setSearchDebounced] = useState<string>('')
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(() => {
      setSearchDebounced(search)
      searchDebounceRef.current = null
    }, SEARCH_DEBOUNCE_MS)
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    }
  }, [search])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const config = await window.api.getConfig()
      if (cancelled) return
      setLogin(config.ddoClientId ?? '')
      setPassword(config.ddoClientSecret ?? '')
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const persistCredentials = async (nextLogin: string, nextPassword: string) => {
    await window.api.setConfigValue('ddoClientId', nextLogin)
    await window.api.setConfigValue('ddoClientSecret', nextPassword)
  }

  const requestToken = async (): Promise<string> => {
    const credentials = btoa(`${login}:${password}`)

    const response = await fetch('https://ddo.metapack.com/oauth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
      }),
    })

    if (!response.ok) {
      throw new Error(`OAuth request failed with status ${response.status}`)
    }

    const data = await response.json()
    const token = data.access_token as string | undefined

    if (!token) {
      throw new Error('OAuth response missing access_token')
    }

    setAccessToken(token)
    return token
  }

  const fetchLocations = useCallback(
    async (token: string, providerIdOverride?: string) => {
      const providerId = providerIdOverride ?? locationProviderId
      const params = new URLSearchParams({
        location_provider_id: providerId,
      })

      const response = await fetch(
        `https://ddo.metapack.com/locations/?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (response.status === 401) {
        throw new Error('UNAUTHORIZED')
      }

      if (!response.ok) {
        throw new Error(`Locations request failed with status ${response.status}`)
      }

      const data = await response.json()
      setLocations(Array.isArray(data) ? (data as DdoLocation[]) : [])
    },
    [locationProviderId],
  )

  const handleFetchLocations = useCallback(
    async (providerIdOverride?: string) => {
      setError(null)
      setIsLoading(true)

      try {
        let token = accessToken
        if (!token) {
          token = await requestToken()
        }

        try {
          await fetchLocations(token, providerIdOverride)
        } catch (err) {
          if (err instanceof Error && err.message === 'UNAUTHORIZED') {
            const newToken = await requestToken()
            await fetchLocations(newToken, providerIdOverride)
          } else {
            throw err
          }
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unexpected error while fetching locations'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    },
    [accessToken, fetchLocations, login, password],
  )

  const handleLoginBlur = async (value: string) => {
    setLogin(value)
    await persistCredentials(value, password)
  }

  const handlePasswordBlur = async (value: string) => {
    setPassword(value)
    await persistCredentials(login, value)
  }

  const searchableByIndex = useMemo(
    () => locations.map(getLocationSearchableString),
    [locations],
  )

  const filteredLocations = useMemo(() => {
    const term = searchDebounced.trim().toLowerCase()
    const hasCountryFilter = selectedCountry !== 'all'
    const selectedUpper = selectedCountry.toUpperCase()

    return locations.filter((loc, i) => {
      if (hasCountryFilter) {
        const locCountry = String(
          loc.structuredAddress?.countryCode ?? loc.countryCode ?? '',
        ).toUpperCase()
        if (
          !locCountry ||
          !(
            locCountry === selectedUpper ||
            locCountry.startsWith(selectedUpper) ||
            selectedUpper.startsWith(locCountry)
          )
        ) {
          return false
        }
      }
      if (!term) return true
      return searchableByIndex[i]?.includes(term) ?? false
    })
  }, [locations, searchDebounced, selectedCountry, searchableByIndex])

  const filteredProviders = useMemo(() => {
    const term = providerSearch.trim().toLowerCase()
    if (!term) return providers
    return providers.filter((p) => {
      const name = p.name.toLowerCase()
      const id = p.id.toLowerCase()
      return name.includes(term) || id.includes(term)
    })
  }, [providers, providerSearch])

  const sortedCountries = useMemo(
    () =>
      [...countries].sort((a, b) =>
        a.countryCode.localeCompare(b.countryCode, undefined, { sensitivity: 'base' }),
      ),
    [countries],
  )

  async function ensureTokenAndFetch(path: string): Promise<any> {
    let token = accessToken
    if (!token) {
      token = await requestToken()
    }

    const makeRequest = async (t: string) => {
      const res = await fetch(`https://ddo.metapack.com${path}`, {
        headers: {
          Authorization: `Bearer ${t}`,
        },
      })
      if (res.status === 401) {
        throw new Error('UNAUTHORIZED')
      }
      if (res.status === 404) {
        const err: any = new Error('NOT_FOUND')
        err.status = 404
        throw err
      }
      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`)
      }
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
  }

  const loadProviders = useCallback(async () => {
    if (!login || !password) {
      toast.error('Configure DDO credentials first')
      return
    }
    try {
      const data = await ensureTokenAndFetch('/locationProviders')
      if (Array.isArray(data)) {
        setProviders(data as LocationProvider[])
      }
    } catch (err) {
      console.error('Failed to load location providers', err)
      toast.error('Failed to load location providers')
    }
  }, [login, password])

  const loadCountriesForProvider = useCallback(
    async (providerId: string) => {
      if (!login || !password) {
        toast.error('Configure DDO credentials first')
        return
      }
      try {
        const data = await ensureTokenAndFetch(
          `/locationProviders/${providerId}/locationsSummary`,
        )
        if (Array.isArray(data)) {
          setCountries(data as CountrySummary[])
        } else {
          setCountries([])
        }
      } catch (err) {
        console.error('Failed to load countries summary', err)
        toast.error('Failed to load country summary')
        setCountries([])
      }
    },
    [login, password],
  )

  const handleFetchOpeningTimes = async (location: DdoLocation, href: string) => {
    const locId = String(location.id)
    setOpeningTimesLoading((prev) => ({ ...prev, [locId]: true }))
    setOpeningTimesError((prev) => ({ ...prev, [locId]: null }))
    try {
      const data = await ensureTokenAndFetch(href)
      setOpeningTimes((prev) => ({ ...prev, [locId]: data as OpeningTimesData }))
    } catch (err) {
      if (err instanceof Error && (err as any).message === 'NOT_FOUND') {
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
  }

  useEffect(() => {
    setFooter(
      <div className="flex items-center justify-end gap-3 text-xs">
        {error && (
          <span className="text-red-600 max-w-xs truncate">
            {error}
          </span>
        )}
        <Button
          variant="outline"
          size="xs"
          onClick={() => {
            if (!filteredLocations.length) return
            const text = JSON.stringify(filteredLocations, null, 2)
            void navigator.clipboard.writeText(text)
            toast.success('Filtered locations JSON copied')
          }}
          disabled={!filteredLocations.length}
        >
          Copy filtered
        </Button>
        <Button
          variant="outline"
          size="xs"
          onClick={() => {
            if (!locations.length) return
            const text = JSON.stringify(locations, null, 2)
            void navigator.clipboard.writeText(text)
            toast.success('Locations JSON copied')
          }}
          disabled={!locations.length}
        >
          Copy raw JSON
        </Button>
        <Button
          variant="default"
          size="xs"
          onClick={() => void handleFetchLocations()}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-1">
              <Spinner className="size-3" /> Loading…
            </span>
          ) : (
            'Fetch locations'
          )}
        </Button>
      </div>,
    )
    return () => setFooter(null)
  }, [setFooter, handleFetchLocations, isLoading, error, locations, filteredLocations])

  return (
    <div className='flex flex-col h-full'>
      <LSToolHeader
        login={login}
        password={password}
        onLoginChange={setLogin}
        onPasswordChange={setPassword}
        onLoginBlur={handleLoginBlur}
        onPasswordBlur={handlePasswordBlur}
      />
      <div className='p-4 flex flex-col gap-3 flex-1 min-h-0'>
        <div className='flex gap-4'>
          <div className='space-y-2 flex-1'>
            <Label>Location Provider ID</Label>
            <div className="flex gap-2 flex-1">
              <Button
                variant="outline"
                className="justify-between flex-1"
                onClick={() => {
                  setProviderDialogOpen(true)
                  if (!providers.length) {
                    void loadProviders()
                  }
                }}
              >
                <span className="truncate text-left">
                  {(() => {
                    const current = providers.find((p) => p.id === locationProviderId)
                    if (current) return `${current.name} (${current.id})`
                    if (locationProviderId) return locationProviderId
                    return 'Select location provider'
                  })()}
                </span>
              </Button>
              <Button variant="outline" onClick={() => {
                if (!locationProviderId) return
                const text = locationProviderId
                void navigator.clipboard.writeText(text)
                toast.success(`${text} copied`)
              }} disabled={!locationProviderId}>
                <LucideCopy /> Copy provider ID
              </Button>
            </div>
          </div>
          <div className='space-y-2'>
            <Label>Country</Label>
            <Select
              value={selectedCountry}
              onValueChange={(v) => setSelectedCountry(v)}
            >
              <SelectTrigger className="min-w-40">
                <SelectValue placeholder="All countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All countries</SelectItem>
                  {sortedCountries.map((c) => (
                    <SelectItem key={c.countryCode} value={c.countryCode}>
                      {c.countryCode} ({c.numberOfLocations})
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className='space-y-2'>
          <InputGroup>
            <InputGroupInput
              placeholder="Search by store name, ID, address, postcode, country…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <InputGroupAddon>
              <LucideSearch />
            </InputGroupAddon>
          </InputGroup>
        </div>

        <LocationsList
          key={locationProviderId || 'none'}
          locations={filteredLocations}
          openingTimes={openingTimes}
          openingTimesLoading={openingTimesLoading}
          openingTimesError={openingTimesError}
          onSelectLocation={(loc) => {
            setSelectedLocation(loc)
            setLocationDialogOpen(true)
          }}
          onFetchOpeningTimes={(loc, href) => {
            void handleFetchOpeningTimes(loc, href)
          }}
        />
      </div>
      <ProviderDialog
        open={providerDialogOpen}
        onOpenChange={setProviderDialogOpen}
        providers={providers}
        filteredProviders={filteredProviders}
        search={providerSearch}
        onSearchChange={setProviderSearch}
        onSelectProvider={(providerId) => {
          setLocationProviderId(providerId)
          setSelectedCountry('all')
          setSearch('')
          setLocations([])
          void loadCountriesForProvider(providerId)
          setProviderDialogOpen(false)
          void handleFetchLocations(providerId)
        }}
      />
      <LocationDetailsDialog
        open={locationDialogOpen}
        location={selectedLocation}
        onOpenChange={(open) => {
          setLocationDialogOpen(open)
          if (!open) {
            setSelectedLocation(null)
          }
        }}
      />
    </div>
  )
}

export default LSToolPage
