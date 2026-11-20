import { useCallback, useEffect, useState } from 'react'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'

export type PengaturanLokasi = {
  center_lat: number
  center_lng: number
  radius_m: number
}

export type Gps = { lat: number; lng: number; akurasi: number }

type IzinGps = 'meminta' | 'ditolak' | 'tidak_didukung' | 'gagal' | 'siap'

export type StatusPosisi =
  | 'meminta'
  | 'ditolak'
  | 'tidak_didukung'
  | 'gagal'
  | 'memuat_batas'
  | 'galat_batas'
  | 'dalam'
  | 'luar'

export type PosisiPelapor = {
  status: StatusPosisi
  gps: Gps | null
  jarak: number | null
  radius: number | null
  // true hanya kalau GPS sudah terbaca DAN posisi ada di dalam radius.
  bisaKirim: boolean
  ulangi: () => void
  muatUlangBatas: () => void
}

// Endpoint ini belum ada di schema.d.ts, jadi klien `api` dipakai lewat
// pembungkus bertipe longgar (pola yang sama dengan lokasi-query.ts).
// Hapus setelah `pnpm types:generate` memuat endpoint-nya.
const http = api as unknown as {
  GET: (
    path: string,
  ) => Promise<{ data?: unknown; error?: unknown; response: Response }>
}

// Titik pusat dan radius yang diatur super admin. Boleh dibaca semua user
// yang login, karena pelapor perlu tahu batasnya.
export const batasLokasiQueryOptions = queryOptions({
  queryKey: ['lokasi', 'batas'],
  queryFn: async (): Promise<PengaturanLokasi> => {
    const { data, error } = await http.GET('/location-settings')
    if (error || !data) throw new Error('Gagal memuat batas lokasi.')
    return (data as { data: PengaturanLokasi }).data
  },
  staleTime: 60_000,
  retry: false,
})

// Rumus Haversine, hasil dalam meter.
export function jarakMeter(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6_371_000
  const rad = (derajat: number) => (derajat * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

// Meminta izin lokasi begitu dipakai (halaman /lapor terbuka), lalu
// membandingkan posisi pelapor dengan titik pusat dan radius dari backend.
export function usePosisiPelapor(): PosisiPelapor {
  const batas = useQuery(batasLokasiQueryOptions)

  const [izin, setIzin] = useState<IzinGps>(() =>
    typeof navigator !== 'undefined' && 'geolocation' in navigator
      ? 'meminta'
      : 'tidak_didukung',
  )
  const [gps, setGps] = useState<Gps | null>(null)

  const ambil = useCallback(() => {
    if (!('geolocation' in navigator)) return

    navigator.geolocation.getCurrentPosition(
      (posisi) => {
        setGps({
          lat: posisi.coords.latitude,
          lng: posisi.coords.longitude,
          akurasi: posisi.coords.accuracy,
        })
        setIzin('siap')
      },
      (error) => {
        setGps(null)
        setIzin(error.code === error.PERMISSION_DENIED ? 'ditolak' : 'gagal')
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    )
  }, [])

  // Dialog izin browser muncul saat halaman dibuka.
  useEffect(() => {
    ambil()
  }, [ambil])

  const ulangi = useCallback(() => {
    setIzin('meminta')
    ambil()
  }, [ambil])

  const pusat = batas.data
    ? { lat: batas.data.center_lat, lng: batas.data.center_lng }
    : null
  const radius = batas.data?.radius_m ?? null
  const jarak = gps && pusat ? jarakMeter(gps, pusat) : null

  let status: StatusPosisi
  if (izin !== 'siap') status = izin
  else if (batas.isPending) status = 'memuat_batas'
  else if (batas.isError || jarak === null || radius === null)
    status = 'galat_batas'
  else status = jarak <= radius ? 'dalam' : 'luar'

  return {
    status,
    gps,
    jarak,
    radius,
    bisaKirim: status === 'dalam',
    ulangi,
    muatUlangBatas: () => void batas.refetch(),
  }
}
