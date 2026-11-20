import { useState } from 'react'
import type { ComponentProps } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'

export function PasswordInput({
  className,
  ...props
}: Omit<ComponentProps<'input'>, 'type'>) {
  const [tampil, setTampil] = useState(false)
  const label = tampil ? 'Sembunyikan password' : 'Tampilkan password'

  return (
    <div className="relative">
      <Input
        {...props}
        type={tampil ? 'text' : 'password'}
        className={`pr-10 ${className ?? ''}`}
      />
      <button
        type="button"
        onClick={() => setTampil((v) => !v)}
        aria-label={label}
        aria-pressed={tampil}
        title={label}
        className="absolute top-1/2 right-2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-neutral-400 transition-colors hover:text-neutral-700 focus-visible:ring-2 focus-visible:ring-[#1f6b4f]/35 focus-visible:outline-none"
      >
        {tampil ? (
          <EyeOff aria-hidden="true" className="size-4" />
        ) : (
          <Eye aria-hidden="true" className="size-4" />
        )}
      </button>
    </div>
  )
}
