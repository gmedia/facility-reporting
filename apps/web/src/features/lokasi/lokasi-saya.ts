import { useCallback, useState } from 'react'

export type LokasiSaya = { lat: number; lng: number; akurasi: number }

type StatusLokasiSaya =
  'diam' | 'mencari' | 'ditolak' | 'gagal' | 'tidak_didukung'

// Akurasi di atas ini dianggap kasar (biasanya laptop yang menebak dari
// Wi-Fi), jadi super admin diminta mengoreksi pin secara manual.
export const AKURASI_KASAR_M = 100

// Membaca posisi GPS super admin saat tombol diklik. `onDapat` dipanggil
// dengan koordinatnya, dan di situlah pin/titik pusat dipindahkan.
export function useLokasiSaya(onDapat: (lokasi: LokasiSaya) => void) {
  const [status, setStatus] = useState<StatusLokasiSaya>('diam')
  const [akurasi, setAkurasi] = useState<number | null>(null)

  const cari = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('tidak_didukung')
      return
    }

    setStatus('mencari')

    navigator.geolocation.getCurrentPosition(
      (posisi) => {
        const lokasi = {
          lat: posisi.coords.latitude,
          lng: posisi.coords.longitude,
          akurasi: posisi.coords.accuracy,
        }
        setAkurasi(lokasi.akurasi)
        setStatus('diam')
        onDapat(lokasi)
      },
      (error) => {
        setAkurasi(null)
        setStatus(error.code === error.PERMISSION_DENIED ? 'ditolak' : 'gagal')
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    )
  }, [onDapat])

  let pesan: string | null = null
  if (status === 'ditolak')
    pesan =
      'Izin lokasi ditolak. Aktifkan lewat ikon gembok di address bar, lalu coba lagi.'
  else if (status === 'gagal')
    pesan =
      'Lokasi belum bisa ditentukan. Pastikan GPS atau layanan lokasi aktif.'
  else if (status === 'tidak_didukung')
    pesan = 'Browser ini tidak mendukung lokasi.'
  else if (akurasi !== null && akurasi > AKURASI_KASAR_M)
    pesan = `Akurasi lokasi ±${Math.round(akurasi)} m. Geser pin kalau kurang tepat.`

  return { cari, mencari: status === 'mencari', pesan }
}
