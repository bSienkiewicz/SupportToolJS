import React, { useEffect } from 'react'
import { Circle, CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import type { LatLngBoundsLiteral } from 'leaflet'
import type { DdoLocation } from '../types'

/** Calls invalidateSize after mount so tiles align when map is in a resizable panel or dialog. */
function MapInvalidateSize() {
  const map = useMap()
  useEffect(() => {
    const id = setTimeout(() => {
      map.invalidateSize()
    }, 250)
    return () => clearTimeout(id)
  }, [map])
  return null
}

/** Fits the map view to include all given locations and optionally the search origin circle. */
function FitBounds({
  locations,
  searchOrigin,
  searchRadiusM,
}: {
  locations: DdoLocation[]
  searchOrigin?: [number, number] | null
  searchRadiusM?: number
}) {
  const map = useMap()
  useEffect(() => {
    const withCoords = locations.filter(
      (loc) =>
        loc.latitude != null &&
        loc.longitude != null &&
        Number.isFinite(loc.latitude) &&
        Number.isFinite(loc.longitude),
    )
    let points: [number, number][] = withCoords.map((l) => [l.latitude!, l.longitude!])
    if (searchOrigin && searchRadiusM != null && searchRadiusM > 0) {
      const [lat, lng] = searchOrigin
      const latDelta = (searchRadiusM / 111320) * 1.1
      const lngDelta = (searchRadiusM / (111320 * Math.cos((lat * Math.PI) / 180))) * 1.1
      points = [
        ...points,
        [lat - latDelta, lng - lngDelta],
        [lat + latDelta, lng + lngDelta],
      ]
    }
    if (points.length === 0) return
    if (points.length === 1) {
      map.setView(points[0], 13)
      return
    }
    const lats = points.map((p) => p[0])
    const lngs = points.map((p) => p[1])
    const bounds: LatLngBoundsLiteral = [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ]
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 15 })
  }, [map, locations, searchOrigin, searchRadiusM])
  return null
}

type LocationsMapViewProps = {
  locations: DdoLocation[]
  /** Optional initial center when there are no locations (e.g. after clearing). */
  defaultCenter?: [number, number]
  defaultZoom?: number
  className?: string
  /** When set (e.g. after a geolocation search), a circle and origin marker are drawn. */
  searchOrigin?: { lat: number; lng: number }
  searchRadiusM?: number
}

/**
 * Map that displays multiple location markers and fits bounds to show them all.
 * Use inside a container with explicit height (e.g. flex-1 min-h-0).
 */
export function LocationsMapView({
  locations,
  defaultCenter = [51.9, 15.5],
  defaultZoom = 6,
  className,
  searchOrigin,
  searchRadiusM,
}: LocationsMapViewProps) {
  const withCoords = locations.filter(
    (loc) =>
      loc.latitude != null &&
      loc.longitude != null &&
      Number.isFinite(loc.latitude) &&
      Number.isFinite(loc.longitude),
  )
  const hasSearchOrigin = searchOrigin != null && Number.isFinite(searchOrigin.lat) && Number.isFinite(searchOrigin.lng)
  const hasSearchRadius = searchRadiusM != null && searchRadiusM > 0
  const originCenter: [number, number] | null = hasSearchOrigin ? [searchOrigin.lat, searchOrigin.lng] : null

  return (
    <div className={className ?? 'h-full w-full rounded-md border overflow-hidden bg-muted/30'}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
        className="h-full w-full"
      >
        <MapInvalidateSize />
        <FitBounds locations={locations} searchOrigin={originCenter} searchRadiusM={hasSearchRadius ? searchRadiusM : undefined} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {originCenter && hasSearchRadius && (
          <Circle
            center={originCenter}
            radius={searchRadiusM!}
            pathOptions={{
              color: 'var(--color-primary, #2563eb)',
              fillColor: 'var(--color-primary, #2563eb)',
              fillOpacity: 0.12,
              weight: 2,
            }}
          />
        )}
        {originCenter && (
          <CircleMarker
            center={originCenter}
            radius={8}
            pathOptions={{
              color: 'var(--color-primary, #2563eb)',
              fillColor: 'var(--color-primary, #2563eb)',
              fillOpacity: 1,
              weight: 2,
            }}
          >
            <Popup>Search origin (radius: {searchRadiusM ?? 0} m)</Popup>
          </CircleMarker>
        )}
        {withCoords.map((loc) => (
          <Marker key={loc.id} position={[loc.latitude!, loc.longitude!]}>
            <Popup>
              {loc.storeName ?? loc.storeId ?? loc.address ?? 'Location'}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
