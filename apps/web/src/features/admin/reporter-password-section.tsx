import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { toast } from 'sonner'
import { TablePager } from '@/components/table-pager'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { errorMessage } from '@/features/admin/users-query'
import {
  daftarMahasiswaQueryOptions,
  useResetPasswordMahasiswa,
  type HasilReset,
  type Mahasiswa,
} from '@/features/admin/reporter-password-query'

const CARD_CLASS =
  'rounded-[26px] border border-neutral-200/70 bg-white shadow-sm'

const CATATAN_SALIN = 'Mahasiswa wajib mengganti password saat login pertama.'

function inisial(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function ReporterPasswordSection() {
  const [cari, setCari] = useState('')
  const [kata, setKata] = useState('')
  const [halaman, setHalaman] = useState(0)
  const [perHalaman, setPerHalaman] = useState(10)
  const [target, setTarget] = useState<Mahasiswa | null>(null)
  const [hasil, setHasil] = useState<HasilReset | null>(null)
  const [tersalin, setTersalin] = useState(false)

  const reset = useResetPasswordMahasiswa()
  const daftar = useQuery(
    daftarMahasiswaQueryOptions(kata, halaman, perHalaman),
  )

  // Tunda pencarian 300 ms supaya tidak memanggil API di tiap ketukan.
  useEffect(() => {
    const timer = setTimeout(() => {
      setKata(cari.trim())
      setHalaman(0)
    }, 300)
    return () => clearTimeout(timer)
  }, [cari])

  function jalankanReset() {
    if (!target) return
    reset.mutate(target.id, {
      onSuccess: (data) => {
        setTarget(null)
        setTersalin(false)
        setHasil(data)
      },
      onError: (error) => toast.error(errorMessage(error)),
    })
  }

  async function salinSemua() {
    if (!hasil) return
    try {
      await navigator.clipboard.writeText(`${hasil.password}\n${CATATAN_SALIN}`)
      setTersalin(true)
      setTimeout(() => setTersalin(false), 2000)
    } catch {
      toast.error('Gagal menyalin. Salin manual dari kotak password.')
    }
  }

  function selesai() {
    setHasil(null)
    reset.reset() // buang password dari memori
  }

  const meta = daftar.data?.meta
  const baris = daftar.data?.data ?? []

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-base font-semibold">Reset password mahasiswa</h2>
        <p className="text-sm text-neutral-500">
          mahasiswa yang lupa password dengan membuat password sementara.
        </p>
      </div>

      <div className={`min-w-0 p-6 ${CARD_CLASS}`}>
        <Input
          type="search"
          value={cari}
          onChange={(event) => setCari(event.target.value)}
          placeholder="Cari nama, NIM, atau e-mail..."
          aria-label="Cari mahasiswa"
          className="h-11 max-w-md rounded-xl"
        />

        {daftar.isPending ? (
          <div className="mt-4 flex flex-col gap-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-5/6" />
            <Skeleton className="h-8 w-2/3" />
          </div>
        ) : daftar.isError ? (
          <div className="mt-6 flex flex-col items-center gap-3 py-6 text-sm text-red-600">
            <span>{errorMessage(daftar.error)}</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => daftar.refetch()}
            >
              Coba lagi
            </Button>
          </div>
        ) : baris.length === 0 ? (
          <p className="mt-6 py-6 text-center text-sm text-neutral-400">
            {kata
              ? 'Tidak ada mahasiswa yang cocok dengan pencarian.'
              : 'Belum ada akun mahasiswa.'}
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <Table className="min-w-[36rem]">
              <TableHeader>
                <TableRow className="border-0 hover:bg-transparent">
                  <TableHead className="pl-3 text-[15px] font-medium text-neutral-500">
                    Nama
                  </TableHead>
                  <TableHead className="text-[15px] font-medium text-neutral-500">
                    NIM
                  </TableHead>
                  <TableHead className="text-[15px] font-medium text-neutral-500">
                    Status
                  </TableHead>
                  <TableHead className="pr-3 text-right text-[15px] font-medium text-neutral-500">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {baris.map((mhs) => (
                  <TableRow
                    key={mhs.id}
                    className="border-t border-neutral-100 hover:bg-[#f7f9f8]"
                  >
                    <TableCell className="py-3 pl-3">
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden="true"
                          className="grid size-11 shrink-0 place-items-center rounded-full bg-emerald-100 text-sm font-semibold text-[#0d3f31]"
                        >
                          {inisial(mhs.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-base font-medium">
                            {mhs.name}
                          </p>
                          <p className="truncate text-sm text-neutral-500">
                            {mhs.email ?? '-'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-sm text-neutral-600">
                      {mhs.nim ?? '-'}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge
                        variant="secondary"
                        className={`rounded-full px-3 text-xs font-medium ${
                          mhs.must_change_password
                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-100'
                            : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
                        }`}
                      >
                        {mhs.must_change_password
                          ? 'Belum ganti password'
                          : 'Sudah ganti password'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 pr-3 text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-full border-[#0d3f31] bg-white px-4 text-sm font-medium text-[#0d3f31] hover:bg-emerald-50 hover:text-[#0d3f31]"
                        onClick={() => setTarget(mhs)}
                      >
                        Reset password
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {meta && meta.total > 0 && (
          <div className="mt-4 flex flex-col gap-3">
            <p className="text-xs text-neutral-500">
              Menampilkan {baris.length} dari {meta.total} mahasiswa. Setiap
              reset tercatat di log aktivitas.
            </p>
            <TablePager
              halaman={halaman}
              totalHalaman={Math.max(meta.last_page, 1)}
              perHalaman={perHalaman}
              onPindah={setHalaman}
              onUbahPerHalaman={(jumlah) => {
                setPerHalaman(jumlah)
                setHalaman(0)
              }}
              label="Halaman daftar mahasiswa"
            />
          </div>
        )}
      </div>

      {/* Dialog 1: konfirmasi */}
      <Dialog
        open={target !== null}
        onOpenChange={(open) => {
          if (!open && !reset.isPending) setTarget(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">Reset password</DialogTitle>
            <DialogDescription>
              {target?.name}
              {target?.nim ? `, NIM ${target.nim}` : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border-[1.5px] border-[#1f6b4f] bg-emerald-50 p-3">
            <p className="text-sm font-semibold text-neutral-900">
              Buat password sementara
            </p>
            <p className="mt-0.5 text-xs text-[#1f6b4f]">
              Anda menyerahkan password langsung ke mahasiswa.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-full px-5"
              disabled={reset.isPending}
              onClick={() => setTarget(null)}
            >
              Batal
            </Button>
            <Button
              type="button"
              className="h-10 rounded-full bg-[#0d3f31] px-5 text-white hover:bg-[#0a3127]"
              disabled={reset.isPending}
              onClick={jalankanReset}
            >
              {reset.isPending ? 'Memproses...' : 'Reset password'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog 2: password sementara (hanya tampil sekali) */}
      <Dialog
        open={hasil !== null}
        onOpenChange={() => {
          // Sengaja diabaikan: hanya tombol "Selesai" yang menutup,
          // supaya password tidak hilang karena klik di luar dialog.
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-lg">
              Password sementara dibuat
            </DialogTitle>
            <DialogDescription>
              Berikan ke {hasil?.name}. Password ini hanya tampil sekali.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-xl border border-dashed border-neutral-400 bg-neutral-50 px-3 py-2.5 font-mono text-sm break-all select-all">
              {hasil?.password}
            </code>
            <Button
              type="button"
              variant="outline"
              className="h-10 shrink-0 rounded-full px-4"
              onClick={salinSemua}
            >
              {tersalin ? (
                <>
                  <Check aria-hidden="true" />
                  Tersalin
                </>
              ) : (
                'Salin semua'
              )}
            </Button>
          </div>

          <div className="rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-900">
            <p className="font-medium">{CATATAN_SALIN}</p>
            <p className="mt-0.5 text-amber-800/80">
              Keterangan ini ikut tersalin bersama password.
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              className="h-10 rounded-full bg-[#0d3f31] px-6 text-white hover:bg-[#0a3127]"
              onClick={selesai}
            >
              Selesai
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
