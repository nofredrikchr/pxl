'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Navbar from '@/components/Navbar'
import { useCredits } from '@/lib/credits/CreditProvider'
import { AI_MODELS } from '@/lib/ai/models'

const PACKAGES = [
  { id: 'pack_50', credits: 50, priceNok: 9, perCredit: '0.18' },
  { id: 'pack_200', credits: 200, priceNok: 29, perCredit: '0.15', popular: true },
  { id: 'pack_500', credits: 500, priceNok: 59, perCredit: '0.12' },
]

function PriserContent() {
  const searchParams = useSearchParams()
  const success = searchParams.get('success')
  const cancelled = searchParams.get('cancelled')
  const { refreshBalance } = useCredits()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  // Refresh balance if returning from successful purchase
  if (success) {
    refreshBalance()
  }

  async function handleBuy(packageId: string) {
    setLoadingId(packageId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setLoadingId(null)
    }
  }

  return (
    <main className="relative z-10 mx-auto max-w-4xl px-6 py-10">
      {/* Success banner */}
      {success && (
        <div className="mb-8 animate-slide-up rounded-ds-md border border-emerald-500/30 bg-emerald-500/[0.07] px-5 py-4 text-center">
          <p className="text-sm font-medium text-emerald-400">
            Kreditter lagt til! Saldoen din er oppdatert.
          </p>
        </div>
      )}

      {cancelled && (
        <div className="mb-8 animate-slide-up rounded-ds-md border border-[var(--border)] bg-[var(--surface-raised)] px-5 py-4 text-center">
          <p className="text-sm text-[var(--text-muted)]">
            Kjøpet ble avbrutt. Du kan prøve igjen når som helst.
          </p>
        </div>
      )}

      <div className="mb-10 animate-fade-in">
        <h1 className="font-display text-3xl text-[var(--text-primary)]">
          Kreditter
        </h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Kjøp kreditter for å generere bilder. Jo større pakke, jo lavere pris per kreditt.
        </p>
      </div>

      {/* Packages */}
      <div className="mb-14 grid animate-slide-up gap-5 sm:grid-cols-3">
        {PACKAGES.map((pkg) => (
          <div
            key={pkg.id}
            className={`group relative flex flex-col rounded-ds-lg p-px transition-all duration-300 ${
              pkg.popular
                ? 'bg-gradient-to-b from-amber-500/60 via-amber-500/20 to-amber-500/5 shadow-[0_0_40px_rgba(217,119,6,0.15)]'
                : 'bg-gradient-to-b from-stone-600/30 to-stone-800/10 hover:from-stone-500/40 hover:to-stone-700/20'
            }`}
          >
            {/* Inner card */}
            <div className={`relative flex h-full flex-col rounded-[13px] px-6 pb-6 pt-7 ${
              pkg.popular
                ? 'bg-[#141110]'
                : 'bg-[var(--surface-raised)]'
            }`}>
              {pkg.popular && (
                <span className="absolute -top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-amber-600 to-amber-500 px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-amber-600/30">
                  Mest populær
                </span>
              )}

              <div className="mb-5">
                <span className="font-display text-4xl text-[var(--text-primary)]">
                  {pkg.credits}
                </span>
                <span className="ml-1.5 text-sm text-[var(--text-muted)]">kreditter</span>
              </div>

              <div className="mb-1">
                <span className="text-2xl font-semibold text-[var(--text-primary)]">
                  {pkg.priceNok} kr
                </span>
              </div>

              <p className="mb-7 text-xs text-[var(--text-faint)]">
                {pkg.perCredit} kr per kreditt
              </p>

              <button
                onClick={() => handleBuy(pkg.id)}
                disabled={loadingId !== null}
                className={`mt-auto w-full rounded-ds-md px-4 py-3 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
                  pkg.popular
                    ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg shadow-amber-600/25 hover:from-amber-500 hover:to-amber-400 hover:shadow-amber-500/30'
                    : 'bg-[var(--surface-overlay)] text-[var(--text-secondary)] hover:bg-[var(--border-hover)] hover:text-[var(--text-primary)]'
                }`}
              >
                {loadingId === pkg.id ? 'Sender...' : 'Kjøp'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Model credit costs */}
      <div className="animate-slide-up">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-faint)]">
          Kreditter per modell
        </h2>
        <div className="overflow-hidden rounded-ds-md bg-[var(--surface-raised)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-faint)]">Modell</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-faint)]">Kategori</th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--text-faint)]">Kreditter</th>
              </tr>
            </thead>
            <tbody>
              {AI_MODELS.map((m, i) => (
                <tr
                  key={m.id}
                  className={`transition-colors hover:bg-white/[0.02] ${i < AI_MODELS.length - 1 ? 'border-b border-white/[0.04]' : ''}`}
                >
                  <td className="px-5 py-3.5 font-medium text-[var(--text-primary)]">{m.name}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        m.tag === 'Rask'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : m.tag === 'Balansert'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-violet-500/10 text-violet-400'
                      }`}
                    >
                      {m.tag}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right tabular-nums text-[var(--text-secondary)]">
                    {m.creditCost}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}

export default function PriserPage() {
  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <Navbar />
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-amber-500" />
          </div>
        }
      >
        <PriserContent />
      </Suspense>
    </div>
  )
}
