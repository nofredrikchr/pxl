'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTransition } from 'react'
import { logout } from '@/app/login/actions'

export default function Navbar() {
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  function handleLogout() {
    startTransition(async () => {
      await logout()
    })
  }

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-zinc-800 bg-[#111] px-6 py-3">
      <Link href="/" className="text-xl font-bold text-white">
        pxl
      </Link>

      <div className="flex items-center gap-6">
        <Link
          href="/"
          className={`text-sm font-medium transition ${
            pathname === '/'
              ? 'text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Generer
        </Link>
        <Link
          href="/gallery"
          className={`text-sm font-medium transition ${
            pathname.startsWith('/gallery')
              ? 'text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Galleri
        </Link>
        <button
          onClick={handleLogout}
          disabled={isPending}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-gray-300 transition hover:border-zinc-500 hover:text-white disabled:opacity-50"
        >
          {isPending ? 'Logger ut...' : 'Logg ut'}
        </button>
      </div>
    </nav>
  )
}
