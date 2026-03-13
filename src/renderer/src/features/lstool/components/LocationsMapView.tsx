import React, { useEffect } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
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

/** Fits the map view to include all given locations. */
function FitBounds({ locations }: { locations: DdoLocation[] }) {
  const map = useMap()
  useEffect(() => {
    const withCoords = locations.filter(
      (loc) =>
        loc.latitude != null &&
        loc.longitude != null &&
        Number.isFinite(loc.latitude) &&
        Number.isFinite(loc.longitude),
    )
    if (withCoords.length === 0) return
    if (withCoords.length === 1) {
      map.setView([withCoords[0].latitude!, withCoords[0].longitude!], 13)
      return
    }
    const bounds: LatLngBoundsLiteral = [
      [
        Math.min(...withCoords.map((l) => l.latitude!)),
        Math.min(...withCoords.map((l) => l.longitude!)),
      ],
      [
        Math.max(...withCoords.map((l) => l.latitude!)),
        Math.max(...withCoords.map((l) => l.longitude!)),
      ],
    ]
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 15 })
  }, [map, locations])
  return null
}

type LocationsMapViewProps = {
  locations: DdoLocation[]
  /** Optional initial center when there are no locations (e.g. after clearing). */
  defaultCenter?: [number, number]
  defaultZoom?: number
  className?: string
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
}: LocationsMapViewProps) {
  const withCoords = locations.filter(
    (loc) =>
      loc.latitude != null &&
      loc.longitude != null &&
      Number.isFinite(loc.latitude) &&
      Number.isFinite(loc.longitude),
  )

  return (
    <div className={className ?? 'h-full w-full rounded-l-md border overflow-hidden bg-muted/30 z-10'}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
        className="h-full w-full"
      >
        <MapInvalidateSize />
        <FitBounds locations={locations} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
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
