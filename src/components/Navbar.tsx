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
    <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[#0c0a09]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <Link
          href="/"
          className="font-display text-2xl tracking-wide text-[var(--text-primary)] transition-colors duration-300 hover:text-amber-400"
        >
          pxl
        </Link>

        <div className="flex items-center gap-1">
          <NavLink href="/" active={pathname === '/'}>
            Generer
          </NavLink>
          <NavLink href="/gallery" active={pathname.startsWith('/gallery')}>
            Galleri
          </NavLink>

          <div className="ml-3 h-5 w-px bg-[var(--border)]" />

          <button
            onClick={handleLogout}
            disabled={isPending}
            className="ml-3 rounded-ds-sm px-3.5 py-1.5 text-sm text-[var(--text-muted)] transition-all duration-200 hover:bg-[var(--surface-raised)] hover:text-[var(--text-primary)] disabled:opacity-50"
          >
            {isPending ? 'Logger ut...' : 'Logg ut'}
          </button>
        </div>
      </div>
    </nav>
  )
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={`relative rounded-ds-sm px-3.5 py-1.5 text-sm font-medium transition-all duration-200 ${
        active
          ? 'text-[var(--text-primary)]'
          : 'text-[var(--text-muted)] hover:bg-[var(--surface-raised)] hover:text-[var(--text-secondary)]'
      }`}
    >
      {children}
      {active && (
        <span className="absolute bottom-0 left-1/2 h-px w-4 -translate-x-1/2 bg-amber-500" />
      )}
    </Link>
  )
}
