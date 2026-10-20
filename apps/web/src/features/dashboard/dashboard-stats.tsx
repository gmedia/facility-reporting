import type { ReactNode } from 'react'
import { CheckCircle2, Clock, FileText, Loader } from 'lucide-react'
import type { Statistik } from './dashboard-query'

// Kartu statistik ngikutin gaya kartu di /verifikasi: krem, ikon bulat
// putih, angka besar. Total 4 kartu biar muat satu baris di layar lebar.
export function DashboardStats({ statistik }: { statistik: Statistik }) {
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <StatCard
        label="Total"
        value={statistik.total}
        icon={<FileText aria-hidden="true" className="size-6" />}
      />
      <StatCard
        label="Menunggu"
        value={statistik.menunggu}
        icon={<Clock aria-hidden="true" className="size-6" />}
      />
      <StatCard
        label="Diproses"
        value={statistik.diproses}
        icon={<Loader aria-hidden="true" className="size-6" />}
      />
      <StatCard
        label="Selesai"
        value={statistik.selesai}
        icon={<CheckCircle2 aria-hidden="true" className="size-6" />}
      />
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string
  value: number
  icon: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[26px] border-[1.5px] border-transparent bg-[#faf3e5] px-4 py-6 text-center">
      <span className="flex size-[62px] items-center justify-center rounded-full bg-white text-[#3b9b6b]">
        {icon}
      </span>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-base text-neutral-600">{label}</p>
    </div>
  )
}
