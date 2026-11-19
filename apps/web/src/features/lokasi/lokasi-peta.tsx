import { useEffect } from 'react'
import { divIcon, latLng } from 'leaflet'
import type { Marker as LeafletMarker } from 'leaflet'
import {
  Circle,
  CircleMarker,
  MapContainer,
  Marker,
  TileLayer,
  Tooltip,
  ZoomControl,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { Fokus, PelaporLokasi } from '@/features/lokasi/lokasi-query'

const WARNA_DALAM = '#1f8a5f'
const WARNA_LUAR = '#dc2626'

// Dibuat sekali di level modul, bukan tiap render.
const pinPusat = divIcon({
  className: '',
  html: `<svg width="32" height="44" viewBox="0 0 32 44" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M16 0C7.2 0 0 7 0 15.6 0 27 16 44 16 44s16-17 16-28.4C32 7 24.8 0 16 0z" fill="#dc2626" stroke="#ffffff" stroke-width="2"/><circle cx="16" cy="15.5" r="5.5" fill="#ffffff"/></svg>`,
  iconSize: [32, 44],
  iconAnchor: [16, 44],
})

type Props = {
  pusat: { lat: number; lng: number }
  radius: number
  fokus: Fokus
  pelapor: PelaporLokasi[]
  onPindah: (lat: number, lng: number) => void
}

// Klik di peta = titik pusat baru. `wrap()` menjaga longitude tetap di
// -180..180 walau peta digeser melewati batas dunia (kalau tidak, backend
// menolaknya dengan 422).
function KlikPeta({ onPindah }: { onPindah: Props['onPindah'] }) {
  useMapEvents({
    click(event) {
      const { lat, lng } = event.latlng.wrap()
      onPindah(lat, lng)
    },
  })
  return null
}

// Zoom ke lingkaran saat peta pertama dibuka dan tiap `fokus.n` berganti
// (hasil pencarian dipilih atau perubahan dibatalkan). Sengaja tidak ikut
// berubah saat slider radius digeser supaya peta tidak lompat-lompat.
function FokusPeta({ fokus, radius }: { fokus: Fokus; radius: number }) {
  const map = useMap()
  const { lat, lng, n } = fokus

  useEffect(() => {
    map.fitBounds(latLng(lat, lng).toBounds(radius * 2), {
      padding: [24, 24],
      animate: n > 0,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, n])

  return null
}

export function LokasiPeta({ pusat, radius, fokus, pelapor, onPindah }: Props) {
  return (
    <MapContainer
      center={[fokus.lat, fokus.lng]}
      zoom={16}
      zoomControl={false}
      scrollWheelZoom={false}
      className="h-full w-full"
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        maxZoom={19}
      />
      <ZoomControl position="bottomright" />

      <KlikPeta onPindah={onPindah} />
      <FokusPeta fokus={fokus} radius={radius} />

      {/* interactive={false}: klik di dalam lingkaran tetap dianggap klik peta */}
      <Circle
        center={[pusat.lat, pusat.lng]}
        radius={radius}
        interactive={false}
        pathOptions={{
          color: '#2563eb',
          weight: 2,
          fillColor: '#3b82f6',
          fillOpacity: 0.12,
        }}
      />

      {pelapor.map((p) =>
        p.lat === null || p.lng === null ? null : (
          <CircleMarker
            key={p.id}
            center={[p.lat, p.lng]}
            radius={6}
            bubblingMouseEvents={false}
            pathOptions={{
              color: '#ffffff',
              weight: 1.5,
              fillColor: p.status === 'outside' ? WARNA_LUAR : WARNA_DALAM,
              fillOpacity: 1,
            }}
          >
            <Tooltip>
              {p.name}
              {p.distance_m !== null
                ? ` · ${p.distance_m.toLocaleString('id-ID')} m`
                : ''}
            </Tooltip>
          </CircleMarker>
        ),
      )}

      <Marker
        position={[pusat.lat, pusat.lng]}
        icon={pinPusat}
        draggable
        eventHandlers={{
          dragend(event) {
            const { lat, lng } = (event.target as LeafletMarker)
              .getLatLng()
              .wrap()
            onPindah(lat, lng)
          },
        }}
      />
    </MapContainer>
  )
}
