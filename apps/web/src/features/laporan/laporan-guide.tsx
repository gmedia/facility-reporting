import {
  BookOpenIcon,
  CameraIcon,
  CircleCheckIcon,
  FileTextIcon,
  LightbulbIcon,
  MapPinIcon,
  TagIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  KATEGORI_LABEL,
  KATEGORI_VALUES,
  STATUS_LABEL,
  type LaporanStatus,
} from './laporan-query'

// Isi panduan sengaja dibuat di file ini (bukan di component) supaya enak
// dibaca dan easily diganti kalo tim mau nambah langkah baru.
const LANGKAH = [
  {
    icon: TagIcon,
    judul: 'Pilih kategori',
    isi: 'Pilih jenis kerusakan yang paling sesuai. Kalau ragu, ambil yang paling mendekati — laporanmu tetap akan dibaca orang yang tepat.',
  },
  {
    icon: MapPinIcon,
    judul: 'Sebutkan lokasi',
    isi: 'Tulis nama gedung, lantai, dan nomor ruang supaya petugas gak perlu menebak atau balik nanya.',
    contoh: 'Gedung H, Lantai 2, Ruang 214',
  },
  {
    icon: FileTextIcon,
    judul: 'Ceritakan kerusakannya',
    isi: 'Uraikan kondisinya, sejak kapan terjadi, dan apa dampaknya buat yang pakai fasilitas itu.',
    contoh:
      'Lampu AC di ruang 301 mati total sejak Senin. Ruangan panas dan 40 mahasiswa bercoworking di sana.',
  },
  {
    icon: CameraIcon,
    judul: 'Lampirkan foto',
    isi: 'Opsional, tapi laporan berfoto jauh lebih cepat diperbaiki. JPG, PNG, atau WebP, maksimal 2 MB.',
  },
]

// Alur status, diambil dari label yang sama kayak yang dipakai di badge
// tabel admin — jadi satu sumber kebenaran, gak mungkin beda isi.
const ALUR: LaporanStatus[] = [
  'menunggu_verifikasi',
  'valid',
  'diproses',
  'selesai',
]

export function LaporanGuide() {
  return (
    <Card
      aria-label="Panduan pengisian"
      className="bg-muted/30 border-border/60"
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpenIcon className="text-muted-foreground size-4" />
          Panduan pengisian
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          Empat langkah singkat. Isi form di sebelah kiri mengikuti urutan ini.
        </p>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        <ol className="flex flex-col gap-5">
          {LANGKAH.map((langkah, index) => {
            const Icon = langkah.icon
            return (
              <li key={langkah.judul} className="flex gap-3">
                <span className="bg-background ring-border/70 text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full ring-1">
                  <Icon className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
                    Langkah {index + 1}
                  </p>
                  <p className="mt-0.5 text-sm font-medium">{langkah.judul}</p>
                  <p className="text-muted-foreground mt-1 text-[13px] leading-relaxed">
                    {langkah.isi}
                  </p>
                  {langkah.contoh ? (
                    <p className="border-border/70 bg-background mt-2.5 rounded-lg border border-dashed px-3 py-2 text-[13px] leading-relaxed">
                      {langkah.contoh}
                    </p>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ol>

        <Separator />

        <div>
          <p className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
            Pilihan kategori
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {KATEGORI_VALUES.map((kategori) => (
              <Badge key={kategori} variant="secondary">
                {KATEGORI_LABEL[kategori]}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <p className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
            Alur laporan
          </p>
          <ol className="mt-2.5 flex flex-col gap-1.5">
            {ALUR.map((status) => (
              <li
                key={status}
                className="text-muted-foreground flex items-center gap-2 text-[13px]"
              >
                <CircleCheckIcon className="size-3.5 shrink-0 opacity-70" />
                {STATUS_LABEL[status]}
              </li>
            ))}
          </ol>
          <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
            Kalau laporan ternyata tidak relevan, statusnya jadi{' '}
            {STATUS_LABEL.ditolak} dan alasannya dikembalikan ke kamu.
          </p>
        </div>

        <div className="bg-background/70 border-border/70 flex gap-2.5 rounded-lg border p-3.5">
          <LightbulbIcon className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <p className="text-[13px] leading-relaxed">
            <span className="font-medium">Tips:</span> Lokasi dan foto yang
            jelas mengurangi laporan yang dibalas &ldquo;bisa dicek lagi?&rdquo;
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
