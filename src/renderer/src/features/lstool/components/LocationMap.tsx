import React, { useEffect } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'

/** Must be rendered inside MapContainer. Calls invalidateSize after mount so tiles align when map is in a dialog. */
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

type LocationMapProps = {
  center: [number, number]
  zoom?: number
  popupContent?: React.ReactNode
}

/**
 * Small map for a single location. Use a fixed-size container so Leaflet gets correct dimensions
 * before initializing; mount only when visible (e.g. when dialog is open) to avoid tile misalignment.
 */
export function LocationMap({
  center,
  zoom = 13,
  popupContent,
}: LocationMapProps) {
  return (
    <div
      className="w-full rounded-md border overflow-hidden bg-muted/30"
      style={{ height: 224 }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        className="h-full w-full"
      >
        <MapInvalidateSize />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={center}>
          {popupContent != null && <Popup>{popupContent}</Popup>}
        </Marker>
      </MapContainer>
    </div>
  )
}
