import { useEffect, useRef, useState } from 'react'

import { Camera, ImageIcon, Trash2, X } from 'lucide-react'

import { BATAS_FOTO_BYTE, FOTO_ACCEPT } from './laporan-query'

const LEBAR_MAKS = 1600

// Target ukuran hasil kompres, dibuat sedikit di bawah batas server (2 MB)
// supaya ada ruang aman.
const TARGET_BYTE = Math.floor(BATAS_FOTO_BYTE * 0.92)

// Mengubah frame video menjadi File JPEG.
function frameKeFile(video: HTMLVideoElement): Promise<File | null> {
  if (!video.videoWidth || !video.videoHeight) {
    return Promise.resolve(null)
  }

  const skala = Math.min(1, LEBAR_MAKS / video.videoWidth)
  const canvas = document.createElement('canvas')

  canvas.width = Math.round(video.videoWidth * skala)
  canvas.height = Math.round(video.videoHeight * skala)

  const context = canvas.getContext('2d')

  if (!context) {
    return Promise.resolve(null)
  }

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

function canvasKeBlob(
  canvas: HTMLCanvasElement,
  kualitas: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', kualitas)
  })
}

// Memuat gambar dengan orientasi EXIF yang benar (foto kamera HP sering
// disimpan miring dan diputar lewat metadata).
async function muatGambar(
  file: File,
): Promise<{ sumber: CanvasImageSource; lebar: number; tinggi: number } | null> {
  try {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: 'from-image',
    })
    return { sumber: bitmap, lebar: bitmap.width, tinggi: bitmap.height }
  } catch {
    // Fallback untuk browser yang belum mendukung opsi di atas.
  }

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({
        sumber: img,
        lebar: img.naturalWidth,
        tinggi: img.naturalHeight,
      })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null)
    }
    img.src = url
  })
}

// Memperkecil foto supaya lolos batas 2 MB. Kalau sudah kecil, dikembalikan
// apa adanya. Kalau gagal diproses (mis. format HEIC yang tidak bisa
// didecode browser), file asli dikembalikan dan validasi biasa yang menolak.
async function kompresFoto(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file

  const gambar = await muatGambar(file)
  if (!gambar) return file

  const { sumber, lebar, tinggi } = gambar

  // Sudah kecil dan dimensinya wajar: tidak perlu diproses.
  if (file.size <= TARGET_BYTE && Math.max(lebar, tinggi) <= LEBAR_MAKS) {
    return file
  }

  let skala = Math.min(1, LEBAR_MAKS / Math.max(lebar, tinggi))
  const kualitasUrut = [0.85, 0.75, 0.65, 0.55, 0.45]

  for (let percobaan = 0; percobaan < 4; percobaan++) {
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(lebar * skala))
    canvas.height = Math.max(1, Math.round(tinggi * skala))

    const context = canvas.getContext('2d')
    if (!context) return file

    // Latar putih supaya PNG transparan tidak jadi hitam saat jadi JPEG.
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(sumber, 0, 0, canvas.width, canvas.height)

    for (const kualitas of kualitasUrut) {
      const blob = await canvasKeBlob(canvas, kualitas)

      if (blob && blob.size <= TARGET_BYTE) {
        const namaDasar = file.name.replace(/\.[^.]+$/, '') || 'foto'
        return new File([blob], `${namaDasar}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        })
      }
    }

    // Masih terlalu besar: perkecil dimensi lalu coba lagi.
    skala *= 0.8
  }

  return file
}

function formatUkuran(byte: number): string {
  if (byte < 1024 * 1024) {
    return `${Math.max(1, Math.round(byte / 1024))} KB`
  }

  return `${(byte / (1024 * 1024)).toFixed(1)} MB`
}

// Validasi URL gambar sebelum digunakan pada img.src.
// Hanya menerima blob dari origin aplikasi sendiri atau data image Base64.
function sanitasiUrl(url: string | null | undefined): string {
  if (!url) return ''

  // Data URL hanya menerima format gambar yang diperbolehkan.
  if (/^data:image\/(jpeg|png|webp);base64,/i.test(url)) {
    return url
  }

  try {
    const parsed = new URL(url)

    if (
      parsed.protocol === 'blob:' &&
      parsed.origin === window.location.origin
    ) {
      return parsed.href
    }

    return ''
  } catch {
    return ''
  }
}

type FotoInputProps = {
  value: File | null
  previewUrl?: string | null
  onFile: (file: File | null) => void
  inputId: string
  disabled?: boolean
  onWebcamAktif?: (aktif: boolean) => void
  ariaLabel?: string
  varian?: 'pill' | 'kartu'
  kosong?: 'kartu' | 'pill'
  petunjuk?: string
}

type HasilPreview = {
  file: File
  url: string
}

export function FotoInput({
  value,
  previewUrl,
  onFile,
  inputId,
  disabled,
  onWebcamAktif,
  ariaLabel = 'Foto',
  varian = 'pill',
  kosong = 'kartu',
  petunjuk = 'Arahkan ke hasil perbaikan, lalu tekan tombol kamera',
}: FotoInputProps) {
  const galeriRef = useRef<HTMLInputElement>(null)
  const kameraHpRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [webcamAktif, setWebcamAktif] = useState(false)
  const [galat, setGalat] = useState<string | null>(null)
  const [hasilPreview, setHasilPreview] = useState<HasilPreview | null>(null)
  const [memproses, setMemproses] = useState(false)

  const kartu = varian === 'kartu'
  const nonaktif = disabled || memproses

  const adaWebcam =
    typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

  // Mendeteksi HP/tablet yang menggunakan layar sentuh.
  const perangkatSentuh =
    typeof window !== 'undefined' &&
    window.matchMedia('(pointer: coarse)').matches &&
    !window.matchMedia('(hover: hover)').matches

  const adaKamera = perangkatSentuh || adaWebcam

  // URL preview eksternal harus lolos validasi.
  const previewUrlValid = sanitasiUrl(previewUrl)

  // Hasil preview hanya digunakan untuk File yang sedang dipilih.
  // Ini mencegah preview file sebelumnya muncul saat file berubah.
  const urlPratinjau =
    previewUrlValid ||
    (value && hasilPreview?.file === value ? hasilPreview.url : '')

  // Membuat preview dari File menggunakan FileReader.
  useEffect(() => {
    if (!value || sanitasiUrl(previewUrl)) {
      return
    }

    let aktif = true
    const reader = new FileReader()

    reader.onload = () => {
      if (!aktif || typeof reader.result !== 'string') {
        return
      }

      const urlAman = sanitasiUrl(reader.result)

      if (urlAman) {
        setHasilPreview({
          file: value,
          url: urlAman,
        })
      }
    }

    reader.readAsDataURL(value)

    return () => {
      aktif = false

      if (reader.readyState === FileReader.LOADING) {
        reader.abort()
      }
    }
  }, [value, previewUrl])

  // Mematikan webcam dan membersihkan stream.
  const matikanWebcam = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setWebcamAktif(false)
  }

  // Pastikan kamera mati ketika komponen dilepas.
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  // Menyalakan webcam laptop.
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
      setGalat('Kamera tidak bisa diakses. Periksa izin kamera di browser.')
    }
  }

  // Menghubungkan stream ke elemen video.
  useEffect(() => {
    if (webcamAktif && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }, [webcamAktif])

  // Memberi tahu komponen pemanggil tentang status webcam.
  useEffect(() => {
    onWebcamAktif?.(webcamAktif)
  }, [webcamAktif, onWebcamAktif])

  // Mengambil foto dari webcam.
  const ambilFoto = async () => {
    if (!videoRef.current) return

    const file = await frameKeFile(videoRef.current)

    matikanWebcam()

    if (file) {
      onFile(file)
    } else {
      setGalat('Gagal mengambil foto. Silakan coba kembali.')
    }
  }

  // Menerima file dari input galeri/kamera HP, mengompresnya dulu, baru
  // diteruskan ke pemanggil sehingga validasi 2 MB memakai ukuran akhir.
  const terimaFile = async (file: File) => {
    setGalat(null)
    setMemproses(true)

    try {
      const hasil = await kompresFoto(file)
      onFile(hasil)
    } catch {
      setGalat('Foto gagal diproses. Coba pilih foto lain.')
    } finally {
      setMemproses(false)
    }
  }

  // Tombol kamera: HP menggunakan kamera bawaan,
  // laptop menggunakan webcam browser.
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

  // Tombol ketika belum ada foto.
  const tombolKosong = (
    <div className="flex flex-wrap gap-2">
      {perangkatSentuh ? (
        <button
          type="button"
          disabled={nonaktif}
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
            disabled={nonaktif}
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
        disabled={nonaktif}
        onClick={() => galeriRef.current?.click()}
        className={tombol}
      >
        <ImageIcon aria-hidden="true" className="size-4" />
        {perangkatSentuh ? 'Pilih dari galeri' : 'Pilih file'}
      </button>
    </div>
  )

  let isi

  if (kartu) {
    // VARIAN KARTU.

    if (webcamAktif) {
      isi = (
        <div className="flex flex-col gap-3">
          {/* Preview: tinggi di HP (3:4), lebar di layar besar (4:3) */}
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-black sm:aspect-[4/3]">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="size-full object-cover"
            />

            {/* Sudut bidik kamera (diberi jarak dari petunjuk atas) */}
            <i className="pointer-events-none absolute top-[22%] left-[12%] size-6 rounded-tl-lg border-t-[3px] border-l-[3px] border-white/85" />
            <i className="pointer-events-none absolute top-[22%] right-[12%] size-6 rounded-tr-lg border-t-[3px] border-r-[3px] border-white/85" />
            <i className="pointer-events-none absolute bottom-[12%] left-[12%] size-6 rounded-bl-lg border-b-[3px] border-l-[3px] border-white/85" />
            <i className="pointer-events-none absolute right-[12%] bottom-[12%] size-6 rounded-br-lg border-r-[3px] border-b-[3px] border-white/85" />

            {/* Petunjuk: boleh 2 baris, tidak dipotong */}
            <div className="pointer-events-none absolute inset-x-3 top-3 rounded-2xl bg-[#0a140f]/70 px-3 py-1.5 text-center text-xs leading-snug font-medium text-white">
              {petunjuk}
            </div>
          </div>

          {/* Kontrol di LUAR video: tombol bulat selalu tepat di tengah */}
          <div className="relative flex h-16 items-center">
            <button
              type="button"
              onClick={matikanWebcam}
              className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3.5 py-2 text-sm font-medium whitespace-nowrap text-neutral-700 transition hover:bg-neutral-200"
            >
              <X aria-hidden="true" className="size-4" />
              Tutup
            </button>

            <button
              type="button"
              aria-label="Ambil foto"
              onClick={() => void ambilFoto()}
              className="absolute left-1/2 grid size-16 -translate-x-1/2 place-items-center rounded-full border-4 border-white bg-[#1f6b4f] shadow-md ring-2 ring-[#1f6b4f] transition active:scale-90"
            >
              <Camera aria-hidden="true" className="size-6 text-white" />
            </button>
          </div>
        </div>
      )
    } else if (value) {
      isi = (
        <div className="relative grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-2xl bg-black">
          {urlPratinjau && (
            <img
              src={urlPratinjau}
              alt="Pratinjau foto terpilih"
              className="size-full object-cover"
              decoding="async"
            />
          )}

          <div className="absolute inset-x-0 bottom-0 flex items-center gap-2.5 bg-gradient-to-t from-[#050f0a]/75 to-transparent p-3.5">
            <div className="min-w-0 flex-1 text-white">
              <p className="truncate text-sm font-medium">{value.name}</p>
              <p className="text-xs opacity-80">{formatUkuran(value.size)}</p>
            </div>

            <button
              type="button"
              disabled={nonaktif}
              onClick={() => onFile(null)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 aria-hidden="true" className="size-4" />
              Hapus foto
            </button>
          </div>
        </div>
      )
    } else if (kosong === 'pill') {
      isi = tombolKosong
    } else {
      isi = (
        <div className="grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-[#c9d6cf] bg-[#f1f6f3] px-4 text-center text-sm text-neutral-500">
          <div className="w-full">
            <span className="mx-auto mb-2 grid size-13 place-items-center rounded-2xl bg-[#e3f1ea] text-[#1f6b4f]">
              <ImageIcon aria-hidden="true" className="size-6.5" />
            </span>
            Belum ada foto
            <div className="mt-3.5 flex gap-2.5">
              {adaKamera && (
                <button
                  type="button"
                  disabled={nonaktif}
                  onClick={bukaKamera}
                  className="flex flex-1 flex-col items-center gap-1 rounded-2xl bg-[#1f6b4f] px-2 py-3.5 text-sm font-medium text-white transition hover:bg-[#0f3d2e] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Camera aria-hidden="true" className="size-5.5" />
                  Kamera
                </button>
              )}

              <button
                type="button"
                disabled={nonaktif}
                onClick={() => galeriRef.current?.click()}
                className="flex flex-1 flex-col items-center gap-1 rounded-2xl bg-[#e3f1ea] px-2 py-3.5 text-sm font-medium text-[#1f6b4f] transition hover:bg-[#d3e9de] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ImageIcon aria-hidden="true" className="size-5.5" />
                {perangkatSentuh ? 'Pilih dari galeri' : 'Pilih file'}
              </button>
            </div>
          </div>
        </div>
      )
    }
  } else if (webcamAktif) {
    // VARIAN PILL.

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
    isi = (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-2.5">
        {urlPratinjau && (
          <img
            src={urlPratinjau}
            alt="Pratinjau foto terpilih"
            className="size-12 shrink-0 rounded-lg object-cover"
            decoding="async"
          />
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
          disabled={nonaktif}
          onClick={() => onFile(null)}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 aria-hidden="true" className="size-4" />
          Hapus foto
        </button>
      </div>
    )
  } else {
    isi = tombolKosong
  }

  const kosongKecil = kartu && kosong === 'pill' && !webcamAktif && !value
  const pakaiJarak = !kartu || kosongKecil

  return (
    <div className={pakaiJarak ? 'mt-3' : undefined}>
      {isi}

      {memproses && (
        <p role="status" className="mt-2 text-sm text-neutral-500">
          Memproses foto…
        </p>
      )}

      {/* Input galeri/file */}
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

          if (file) {
            void terimaFile(file)
          }
        }}
      />

      {/* Input kamera HP */}
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

          if (file) {
            void terimaFile(file)
          }
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