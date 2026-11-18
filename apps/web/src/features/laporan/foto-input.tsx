import { useEffect, useRef, useState } from 'react'
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

// Sanitasi URL untuk CodeQL DOM XSS: hanya izinkan blob: atau data:image/*
// Kembalikan '' jika tidak aman, agar CodeQL yakin hanya data bersih ke img.src.
function sanitasiUrl(url: string | null | undefined): string {
  if (!url || !/^blob:|^data:image\//.test(url)) return ''
  return url
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
  petunjuk = 'Arahkan ke hasil perbaikan, lalu tekan tombol bulat',
}: {
  // Foto yang sedang terpilih (null = belum ada). Dikontrol oleh pemanggil.
  value: File | null
  // URL pratinjau gambar yang sudah aman (data:image/*). Dibuat oleh
  // pemanggil (verifikasi-page.tsx) lewat FileReader.readAsDataURL, bukan
  // di dalam komponen ini.
  previewUrl?: string | null
  // Dipanggil dengan File baru, atau null saat foto dihapus.
  onFile: (file: File | null) => void
  inputId: string
  disabled?: boolean
  // Dipanggil saat webcam menyala/mati.
  onWebcamAktif?: (aktif: boolean) => void
  // Label aksesibilitas untuk input file. Default "Foto".
  ariaLabel?: string
  // 'pill'  = tombol kecil di bawah (bawaan).
  // 'kartu' = satu kotak 4:3 lengkap: kamera/Pilih file, video dengan
  //           overlay, dan pratinjau besar.
  varian?: 'pill' | 'kartu'
  // Hanya untuk varian 'kartu' saat belum ada foto dan kamera mati:
  // 'kartu' = kotak putus-putus 4:3 (bawaan, dipakai dialog bukti).
  // 'pill'  = tombol kecil seperti varian 'pill'.
  kosong?: 'kartu' | 'pill'
  // Teks petunjuk di atas kamera (varian 'kartu').
  petunjuk?: string
}) {
  const galeriRef = useRef<HTMLInputElement>(null)
  const kameraHpRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [webcamAktif, setWebcamAktif] = useState(false)
  const [galat, setGalat] = useState<string | null>(null)
  // hasPreview turunkan selama render (bukan di effect) untuk menghindari
  // react-hooks/no-set-state-in-effect. Jika previewUrl ada,
  // kita tahu akan ada pratinjau (effect akan set img.src segera setelah render).
  const hasPreview = !!previewUrl

  const adaWebcam =
    typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

  // HP/tablet murni: layar sentuh DAN tidak ada mouse/trackpad (hover).
  const perangkatSentuh =
    typeof window !== 'undefined' &&
    window.matchMedia('(pointer: coarse)').matches &&
    !window.matchMedia('(hover: hover)').matches

  const kartu = varian === 'kartu'

  const matikanWebcam = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setWebcamAktif(false)
  }

  // Pastikan kamera mati saat komponen ditutup.
  useEffect(() => matikanWebcam, [])

  // Tampilkan pratinjau dari previewUrl yang dibuat oleh pemanggil
  // (verifikasi-page.tsx lewat URL.createObjectURL). FotoInput cuma menampilkan,
  // tidak membuat URL baru, sehingga tidak ada taint dari e.target.files di sini.
  useEffect(() => {
    const img = imgRef.current
    if (!previewUrl) {
      if (img) img.src = ''
      return
    }
    const aman = sanitasiUrl(previewUrl)
    if (img) img.src = aman
    return () => {
      if (aman.startsWith('blob:')) {
        URL.revokeObjectURL(aman)
      }
    }
  }, [previewUrl])

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

  // Tombol kamera: HP buka kamera bawaan, laptop nyalakan webcam.
  const bukaKamera = () => {
    if (perangkatSentuh) kameraHpRef.current?.click()
    else void nyalakanWebcam()
  }
  const adaKamera = perangkatSentuh || adaWebcam

  const tombol =
    'inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-50 px-3.5 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50'

  // Tombol kecil kondisi kosong (belum ada foto, kamera mati).
  const tombolKosong = (
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

  let isi

  if (kartu) {
    // ============ VARIAN KARTU (tampilan prototype) ============
    if (webcamAktif) {
      isi = (
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="size-full object-cover"
          />

          {/* Sudut bidik */}
          <i className="pointer-events-none absolute top-[20%] left-[14%] size-6.5 rounded-tl-lg border-t-[3px] border-l-[3px] border-white/85" />
          <i className="pointer-events-none absolute top-[20%] right-[14%] size-6.5 rounded-tr-lg border-t-[3px] border-r-[3px] border-white/85" />
          <i className="pointer-events-none absolute bottom-[24%] left-[14%] size-6.5 rounded-bl-lg border-b-[3px] border-l-[3px] border-white/85" />
          <i className="pointer-events-none absolute right-[14%] bottom-[24%] size-6.5 rounded-br-lg border-r-[3px] border-b-[3px] border-white/85" />

          {/* Petunjuk di atas */}
          <div className="absolute inset-x-3 top-3 rounded-full bg-[#0a140f]/70 px-3 py-1 text-center text-xs text-white">
            {petunjuk}
          </div>

          {/* Kontrol di bawah */}
          <div className="absolute inset-x-0 bottom-0 flex items-center bg-gradient-to-t from-[#050f0a]/75 to-transparent px-4 pt-10 pb-5">
            <button
              type="button"
              onClick={matikanWebcam}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-2 text-sm font-medium whitespace-nowrap text-white backdrop-blur-sm transition hover:bg-white/30"
            >
              <X aria-hidden="true" className="size-4" />
              Tutup kamera
            </button>

            {/* Tombol bulat persis di tengah, dengan jarak dari tepi bawah */}
            <button
              type="button"
              aria-label="Ambil foto"
              onClick={() => void ambilFoto()}
              className="absolute bottom-5 left-1/2 size-15.5 -translate-x-1/2 rounded-full bg-[#1f6b4f] ring-4 ring-white transition active:scale-90"
            />
          </div>
        </div>
      )
    } else if (value) {
      isi = (
        <div className="relative grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-2xl bg-black">
          <img
            ref={imgRef}
            alt="Pratinjau foto terpilih"
            className="size-full object-cover"
            decoding="async"
            src=""
            style={{ display: hasPreview ? 'block' : 'none' }}
          />
          {!hasPreview && (
            <ImageIcon aria-hidden="true" className="size-10 text-white/60" />
          )}

          <div className="absolute inset-x-0 bottom-0 flex items-center gap-2.5 bg-gradient-to-t from-[#050f0a]/75 to-transparent p-3.5">
            <div className="min-w-0 flex-1 text-white">
              <p className="truncate text-sm font-medium">{value.name}</p>
              <p className="text-xs opacity-80">{formatUkuran(value.size)}</p>
            </div>
            <button
              type="button"
              disabled={disabled}
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
      // Kondisi kosong: tombol kecil, bukan kotak putus-putus besar.
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
                  disabled={disabled}
                  onClick={bukaKamera}
                  className="flex flex-1 flex-col items-center gap-1 rounded-2xl bg-[#1f6b4f] px-2 py-3.5 text-sm font-medium text-white transition hover:bg-[#0f3d2e] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Camera aria-hidden="true" className="size-5.5" />
                  Kamera
                </button>
              )}
              <button
                type="button"
                disabled={disabled}
                onClick={() => galeriRef.current?.click()}
                className="hover:bg:#{d3e9de} flex flex-1 flex-col items-center gap-1 rounded-2xl bg-[#e3f1ea] px-2 py-3.5 text-sm font-medium text-[#1f6b4f] transition disabled:cursor-not-allowed disabled:opacity-50"
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
    // ============ VARIAN PILL (bawaan) ============
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
        <img
          ref={imgRef}
          alt="Pratinjau foto terpilih"
          className="size-12 shrink-0 rounded-lg object-cover"
          src=""
          style={{ display: hasPreview ? 'block' : 'none' }}
        />
        {!hasPreview && (
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
          className="transition:hover:bg-red-50 inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-sm font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 aria-hidden="true" className="size-4" />
          Hapus foto
        </button>
      </div>
    )
  } else {
    isi = tombolKosong
  }

  // Jarak atas: varian 'pill' selalu pakai mt-3. Varian 'kartu' hanya pakai
  // mt-3 saat menampilkan tombol kecil (kosong="pill").
  const kosongKecil = kartu && kosong === 'pill' && !webcamAktif && !value
  const pakaiJarak = !kartu || kosongKecil

  return (
    <div className={pakaiJarak ? 'mt-3' : undefined}>
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
