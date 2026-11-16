import { useEffect, useMemo, useRef, useState } from 'react'
import { Camera, ImageIcon, Trash2, X } from 'lucide-react'
import { FOTO_ACCEPT } from './laporan-query'

const LEBAR_MAKS = 1600

// Kecilkan frame video jadi File JPEG supaya muat batas 2 MB.
function frameKeFile(video: HTMLVideoElement): Promise<File | null> {
  const skala = Math.min(1, LEBAR_MAKS / video.videoWidth)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(video.videoWidth * skala)
  canvas.height = Math.round(video.videoHeight * skala)
  canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height)

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) =>
        resolve(
          blob
            ? new File([blob], `foto-${Date.now()}.jpg`, {
                type: 'image/jpeg',
              })
            : null,
        ),
      'image/jpeg',
      0.85,
    )
  })
}

function formatUkuran(byte: number): string {
  if (byte < 1024 * 1024) return `${Math.max(1, Math.round(byte / 1024))} KB`
  return `${(byte / (1024 * 1024)).toFixed(1)} MB`
}

export function FotoInput({
  value,
  onFile,
  inputId,
  disabled,
  pratinjau = false,
  onWebcamAktif,
  ariaLabel = 'Foto',
}: {
  // Foto yang sedang terpilih (null = belum ada). Dikontrol oleh pemanggil.
  value: File | null
  // Dipanggil dengan File baru, atau null saat foto dihapus.
  onFile: (file: File | null) => void
  inputId: string
  disabled?: boolean
  // true = tampilkan thumbnail kecil di samping nama file. Matikan kalau
  // pemanggil sudah punya pratinjau sendiri (contoh: dialog bukti).
  pratinjau?: boolean
  // Dipanggil saat webcam menyala/mati, supaya pemanggil bisa
  // menyembunyikan pratinjau miliknya sendiri.
  onWebcamAktif?: (aktif: boolean) => void
  // Label aksesibilitas untuk input file. Default "Foto".
  ariaLabel?: string
}) {
  const galeriRef = useRef<HTMLInputElement>(null)
  const kameraHpRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [webcamAktif, setWebcamAktif] = useState(false)
  const [galat, setGalat] = useState<string | null>(null)

  const adaWebcam =
    typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

  // HP/tablet murni: layar sentuh DAN tidak ada mouse/trackpad (hover).
  const perangkatSentuh =
    typeof window !== 'undefined' &&
    window.matchMedia('(pointer: coarse)').matches &&
    !window.matchMedia('(hover: hover)').matches

  // Thumbnail kecil untuk foto yang terpilih.
  const thumb = useMemo(
    () =>
      pratinjau && value && value.type.startsWith('image/')
        ? URL.createObjectURL(value)
        : null,
    [pratinjau, value],
  )
  useEffect(() => {
    return () => {
      if (thumb) URL.revokeObjectURL(thumb)
    }
  }, [thumb])

  const matikanWebcam = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setWebcamAktif(false)
  }

  // Pastikan kamera mati saat komponen ditutup.
  useEffect(() => matikanWebcam, [])

  const nyalakanWebcam = async () => {
    setGalat(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })
      streamRef.current = stream
      setWebcamAktif(true)
    } catch {
      setGalat('Kamera tidak bisa diakses. Periksa izin kamera di browser.')
    }
  }

  // Sambungkan stream ke <video> setelah elemennya muncul.
  useEffect(() => {
    if (webcamAktif && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }, [webcamAktif])

  // Beri tahu pemanggil kapan webcam menyala/mati.
  useEffect(() => {
    onWebcamAktif?.(webcamAktif)
  }, [webcamAktif, onWebcamAktif])

  const ambilFoto = async () => {
    if (!videoRef.current) return
    const file = await frameKeFile(videoRef.current)
    matikanWebcam()
    if (file) onFile(file)
  }

  const tombol =
    'inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-50 px-3.5 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50'

  let isi
  if (webcamAktif) {
    isi = (
      <div className="flex flex-col gap-2">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="aspect-[4/3] w-full rounded-xl border border-neutral-200 bg-black object-cover"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void ambilFoto()}
            className={tombol}
          >
            <Camera aria-hidden="true" className="size-4" />
            Ambil foto
          </button>
          <button type="button" onClick={matikanWebcam} className={tombol}>
            <X aria-hidden="true" className="size-4" />
            Tutup kamera
          </button>
        </div>
      </div>
    )
  } else if (value) {
    // Sudah ada foto: tombol kamera/file disembunyikan, hanya bisa dihapus.
    isi = (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-2.5">
        {thumb ? (
          <img
            src={thumb}
            alt="Pratinjau foto terpilih"
            className="size-12 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-white text-emerald-700">
            <ImageIcon aria-hidden="true" className="size-5" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-emerald-900">
            {value.name}
          </p>
          <p className="text-xs text-emerald-800/70">
            {formatUkuran(value.size)}
          </p>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onFile(null)}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 aria-hidden="true" className="size-4" />
          Hapus foto
        </button>
      </div>
    )
  } else {
    isi = (
      <div className="flex flex-wrap gap-2">
        {perangkatSentuh ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => kameraHpRef.current?.click()}
            className={tombol}
          >
            <Camera aria-hidden="true" className="size-4" />
            Ambil foto
          </button>
        ) : (
          adaWebcam && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => void nyalakanWebcam()}
              className={tombol}
            >
              <Camera aria-hidden="true" className="size-4" />
              Kamera
            </button>
          )
        )}
        <button
          type="button"
          disabled={disabled}
          onClick={() => galeriRef.current?.click()}
          className={tombol}
        >
          <ImageIcon aria-hidden="true" className="size-4" />
          {perangkatSentuh ? 'Pilih dari galeri' : 'Pilih file'}
        </button>
      </div>
    )
  }

  return (
    <div className="mt-3">
      {isi}

      {/* Input tersembunyi: galeri/file dan kamera HP. */}
      <input
        ref={galeriRef}
        id={inputId}
        type="file"
        accept={FOTO_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-label={ariaLabel}
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null
          e.target.value = ''
          if (file) onFile(file)
        }}
      />
      <input
        ref={kameraHpRef}
        type="file"
        accept={FOTO_ACCEPT}
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-label="Ambil foto dengan kamera"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null
          e.target.value = ''
          if (file) onFile(file)
        }}
      />

      {galat && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {galat}
        </p>
      )}
    </div>
  )
}
