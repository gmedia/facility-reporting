import { useEffect, useMemo, useRef, useState } from 'react'
import { Camera, ImageIcon, X, LoaderCircle } from 'lucide-react'
import { FOTO_ACCEPT } from './laporan-query'

function frameKeFile(video: HTMLVideoElement): Promise<File | null> {
  if (!video.videoWidth || !video.videoHeight) {
    return Promise.resolve(null)
  }

  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight

  const context = canvas.getContext('2d')
  if (!context) return Promise.resolve(null)

  context.drawImage(video, 0, 0, canvas.width, canvas.height)

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(
          blob
            ? new File([blob], `foto-${Date.now()}.jpg`, {
                type: 'image/jpeg',
              })
            : null,
        )
      },
      'image/jpeg',
      0.85,
    )
  })
}

function formatUkuran(byte: number): string {
  if (byte < 1024 * 1024) {
    return `${Math.max(1, Math.round(byte / 1024))} KB`
  }

  return `${(byte / (1024 * 1024)).toFixed(1)} MB`
}

interface FotoInputProps {
  value?: File | null
  previewUrl?: string | null
  onFile: (file: File | null) => void | boolean | Promise<void | boolean>
  inputId?: string
  disabled?: boolean
  onWebcamAktif?: (aktif: boolean) => void
  ariaLabel?: string
  varian?: 'pill' | 'kartu'
  kosong?: 'kartu' | 'pill'
  petunjuk?: string
  error?: string
}

export function FotoInput({
  value,
  onFile,
  inputId = 'foto-input',
  disabled,
  onWebcamAktif,
  ariaLabel = 'Foto',
  varian = 'pill',
  kosong = 'kartu',
  petunjuk = 'Arahkan ke hasil perbaikan, lalu tekan tombol kamera',
  error,
}: FotoInputProps) {
  const galeriRef = useRef<HTMLInputElement>(null)
  const kameraHpRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [webcamAktif, setWebcamAktif] = useState(false)
  const [memproses, setMemproses] = useState(false)
  const [galat, setGalat] = useState<string | null>(null)

  // Menyimpan sumber foto yang dipilih pengguna.
  const [sumberFoto, setSumberFoto] = useState<'kamera' | 'file' | null>(null)

  const kartu = varian === 'kartu'
  const nonaktif = disabled || memproses

  const adaWebcam =
    typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

  const perangkatSentuh =
    typeof window !== 'undefined' &&
    window.matchMedia('(pointer: coarse)').matches &&
    !window.matchMedia('(hover: hover)').matches

  const adaKamera = perangkatSentuh || adaWebcam

  const urlPratinjau = useMemo(
    () => (value ? URL.createObjectURL(value) : null),
    [value],
  )

  useEffect(() => {
    return () => {
      if (urlPratinjau) URL.revokeObjectURL(urlPratinjau)
    }
  }, [urlPratinjau])

  // Memproses foto melalui callback dari LaporanForm.
  const prosesFile = async (file: File | null, sumber?: 'kamera' | 'file') => {
    setGalat(null)

    if (!file) {
      await onFile(null)
      setSumberFoto(null)
      return
    }

    setMemproses(true)

    try {
      const berhasil = await onFile(file)

      if (berhasil === false) {
        setGalat('Foto gagal diproses. Silakan periksa format dan ukuran foto.')
        return
      }

      setSumberFoto(sumber ?? null)
    } catch (err) {
      console.error('Gagal memproses foto:', err)
      setGalat('Gagal menambahkan foto. Silakan coba kembali.')
    } finally {
      setMemproses(false)
    }
  }

  // Mengaktifkan webcam laptop.
  const nyalakanWebcam = async () => {
    setGalat(null)

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setGalat('Browser tidak mendukung akses kamera.')
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })

      streamRef.current = stream
      setWebcamAktif(true)
    } catch {
      setGalat('Kamera tidak bisa diakses. Periksa izin kamera browser.')
    }
  }

  // Menghubungkan stream dengan video.
  useEffect(() => {
    if (!webcamAktif || !videoRef.current || !streamRef.current) return

    const video = videoRef.current
    video.srcObject = streamRef.current

    const playVideo = () => {
      video.play().catch((err) => {
        console.warn('Gagal memutar video:', err)
      })
    }

    video.addEventListener('loadedmetadata', playVideo, { once: true })

    if (video.readyState >= 1) playVideo()

    return () => {
      video.removeEventListener('loadedmetadata', playVideo)
    }
  }, [webcamAktif])

  useEffect(() => {
    onWebcamAktif?.(webcamAktif)
  }, [webcamAktif, onWebcamAktif])

  const matikanWebcam = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setWebcamAktif(false)
  }

  const ambilFoto = async () => {
    if (!videoRef.current) return

    const file = await frameKeFile(videoRef.current)
    matikanWebcam()

    if (file) {
      await prosesFile(file, 'kamera')
    } else {
      setGalat('Gagal mengambil foto. Silakan coba kembali.')
    }
  }

  const bukaKamera = () => {
    setGalat(null)

    if (perangkatSentuh) {
      kameraHpRef.current?.click()
    } else {
      void nyalakanWebcam()
    }
  }

  const tombol =
    'inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-50 px-3.5 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50'

  // Tombol saat belum ada foto.
  const tombolKosong = (
    <div className="flex flex-wrap gap-2">
      {adaKamera && (
        <button
          type="button"
          disabled={nonaktif}
          onClick={bukaKamera}
          className={tombol}
        >
          <Camera className="size-4" />
          {perangkatSentuh ? 'Ambil foto' : 'Kamera'}
        </button>
      )}

      <button
        type="button"
        disabled={nonaktif}
        onClick={() => galeriRef.current?.click()}
        className={tombol}
      >
        <ImageIcon className="size-4" />
        {perangkatSentuh ? 'Pilih dari galeri' : 'Pilih file'}
      </button>
    </div>
  )

  let isi

  if (webcamAktif) {
    isi = kartu ? (
      <div className="flex flex-col gap-3">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="size-full object-cover"
          />

          <div className="pointer-events-none absolute inset-x-3 top-3 rounded-2xl bg-[#0a140f]/70 px-3 py-2 text-center text-xs font-medium text-white">
            {petunjuk}
          </div>

          <i className="pointer-events-none absolute top-[22%] left-[12%] size-6 rounded-tl-lg border-t-[3px] border-l-[3px] border-white" />
          <i className="pointer-events-none absolute top-[22%] right-[12%] size-6 rounded-tr-lg border-t-[3px] border-r-[3px] border-white" />
          <i className="pointer-events-none absolute bottom-[12%] left-[12%] size-6 rounded-bl-lg border-b-[3px] border-l-[3px] border-white" />
          <i className="pointer-events-none absolute right-[12%] bottom-[12%] size-6 rounded-br-lg border-r-[3px] border-b-[3px] border-white" />
        </div>

        <div className="relative flex h-16 items-center">
          <button
            type="button"
            onClick={matikanWebcam}
            className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3.5 py-2 text-sm font-medium text-neutral-700"
          >
            <X className="size-4" />
            Tutup
          </button>

          <button
            type="button"
            aria-label="Ambil foto"
            onClick={() => void ambilFoto()}
            className="absolute left-1/2 grid size-16 -translate-x-1/2 place-items-center rounded-full border-4 border-white bg-[#1f6b4f] shadow-md ring-2 ring-[#1f6b4f] active:scale-90"
          >
            <Camera className="size-6 text-white" />
          </button>
        </div>
      </div>
    ) : (
      <div className="flex flex-col gap-2">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="aspect-[4/3] w-full rounded-xl border bg-black object-cover"
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void ambilFoto()}
            className={tombol}
          >
            <Camera className="size-4" />
            Ambil foto
          </button>

          <button type="button" onClick={matikanWebcam} className={tombol}>
            <X className="size-4" />
            Tutup kamera
          </button>
        </div>
      </div>
    )
  } else if (memproses) {
    // Indikator saat foto sedang dikompres.
    isi = (
      <div className="flex min-h-24 items-center justify-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-5">
        <LoaderCircle className="size-6 animate-spin text-emerald-700" />
        <div>
          <p className="text-sm font-semibold text-emerald-900">
            Memproses foto...
          </p>
          <p className="text-xs text-emerald-700">
            Mohon tunggu, foto sedang dikompres.
          </p>
        </div>
      </div>
    )
  } else if (value) {
    // Tampilan setelah foto berhasil diproses.
    if (kartu) {
      isi = (
        <div className="flex flex-col gap-3">
          <div className="relative grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-2xl bg-black">
            {urlPratinjau ? (
              <img
                src={urlPratinjau}
                alt="Pratinjau foto terpilih"
                className="size-full object-cover"
                decoding="async"
              />
            ) : (
              <div className="text-sm text-white">{value.name}</div>
            )}

            <div className="absolute inset-x-0 bottom-0 flex items-center gap-2.5 bg-gradient-to-t from-[#050f0a]/80 to-transparent p-3.5">
              <div className="min-w-0 flex-1 text-white">
                <p className="truncate text-sm font-medium">{value.name}</p>
                <p className="text-xs opacity-80">{formatUkuran(value.size)}</p>
              </div>

              <button
                type="button"
                disabled={disabled}
                onClick={() => void prosesFile(null)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <X className="size-4" />
                Batal
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p
              role="status"
              className="flex items-center gap-1.5 text-sm font-medium text-emerald-700"
            >
              <span className="grid size-5 place-items-center rounded-full bg-emerald-100">
                ✓
              </span>
              Foto berhasil ditambahkan
            </p>

            {sumberFoto === 'file' ? (
              <button
                type="button"
                disabled={disabled}
                onClick={() => galeriRef.current?.click()}
                className={tombol}
              >
                <ImageIcon className="size-4" />
                {perangkatSentuh ? 'Pilih dari galeri' : 'Pilih file'}
              </button>
            ) : (
              adaKamera && (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={bukaKamera}
                  className={tombol}
                >
                  <Camera className="size-4" />
                  {perangkatSentuh ? 'Ambil foto' : 'Kamera'}
                </button>
              )
            )}
          </div>
        </div>
      )
    } else {
      isi = (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-2.5">
            {urlPratinjau ? (
              <img
                src={urlPratinjau}
                alt="Pratinjau foto terpilih"
                className="size-12 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <ImageIcon className="size-6" />
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
              onClick={() => void prosesFile(null)}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <X className="size-4" />
              Batal
            </button>

            {sumberFoto === 'file' ? (
              <button
                type="button"
                disabled={disabled}
                onClick={() => galeriRef.current?.click()}
                aria-label="Pilih file lain"
                className="grid size-9 place-items-center rounded-lg border border-emerald-200 bg-white text-emerald-700"
              >
                <ImageIcon className="size-4" />
              </button>
            ) : (
              adaKamera && (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={bukaKamera}
                  aria-label="Ambil ulang foto"
                  className="grid size-9 place-items-center rounded-lg border border-emerald-200 bg-white text-emerald-700"
                >
                  <Camera className="size-4" />
                </button>
              )
            )}
          </div>

          <p
            role="status"
            className="flex items-center gap-1.5 text-xs font-medium text-emerald-700"
          >
            ✓ Foto berhasil ditambahkan
          </p>
        </div>
      )
    }
  } else if (kartu && kosong !== 'pill') {
    isi = (
      <div className="grid aspect-[4/3] w-full place-items-center rounded-2xl border-2 border-dashed border-[#c9d6cf] bg-[#f1f6f3] px-4 text-center text-sm text-neutral-500">
        <div className="w-full">
          <span className="mx-auto mb-2 grid size-13 place-items-center rounded-2xl bg-[#e3f1ea] text-[#1f6b4f]">
            <ImageIcon className="size-6" />
          </span>
          Belum ada foto
          <div className="mt-3.5 flex gap-2.5">
            {adaKamera && (
              <button
                type="button"
                disabled={nonaktif}
                onClick={bukaKamera}
                className="flex flex-1 flex-col items-center gap-1 rounded-2xl bg-[#1f6b4f] px-2 py-3.5 text-sm font-medium text-white"
              >
                <Camera className="size-5" />
                Kamera
              </button>
            )}

            <button
              type="button"
              disabled={nonaktif}
              onClick={() => galeriRef.current?.click()}
              className="flex flex-1 flex-col items-center gap-1 rounded-2xl bg-[#e3f1ea] px-2 py-3.5 text-sm font-medium text-[#1f6b4f]"
            >
              <ImageIcon className="size-5" />
              Pilih file
            </button>
          </div>
        </div>
      </div>
    )
  } else {
    isi = tombolKosong
  }

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  return (
    <div className={!kartu || kosong === 'pill' ? 'mt-3' : undefined}>
      {isi}

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

          if (file) void prosesFile(file, 'file')
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

          if (file) void prosesFile(file, 'kamera')
        }}
      />

      {(error || galat) && (
        <p
          role="alert"
          className="mt-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          <span className="font-semibold">Gagal menambahkan foto:</span>{' '}
          {error || galat}
        </p>
      )}
    </div>
  )
}
