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
        <div className="mb-8 animate-slide-up rounded-ds-md border border-[var(--border)] bg-[var(--surface-raised)]/50 px-5 py-4 text-center">
          <p className="text-sm text-[var(--text-muted)]">
            Kjopet ble avbrutt. Du kan prove igjen nar som helst.
          </p>
        </div>
      )}

      <div className="mb-10 animate-fade-in">
        <h1 className="font-display text-3xl text-[var(--text-primary)]">
          Kreditter
        </h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Kjop kreditter for a generere bilder. Jo storre pakke, jo lavere pris per kreditt.
        </p>
      </div>

      {/* Packages */}
      <div className="mb-14 grid animate-slide-up gap-4 sm:grid-cols-3">
        {PACKAGES.map((pkg) => (
          <div
            key={pkg.id}
            className={`relative flex flex-col rounded-ds-lg border p-6 transition-all duration-200 ${
              pkg.popular
                ? 'border-amber-500/50 bg-amber-500/[0.04] shadow-glow'
                : 'border-[var(--border)] bg-[var(--surface-raised)]/50 hover:border-[var(--border-hover)]'
            }`}
          >
            {pkg.popular && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                Mest populaer
              </span>
            )}

            <div className="mb-4">
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

            <p className="mb-6 text-xs text-[var(--text-faint)]">
              {pkg.perCredit} kr per kreditt
            </p>

            <button
              onClick={() => handleBuy(pkg.id)}
              disabled={loadingId !== null}
              className={`mt-auto w-full rounded-ds-md px-4 py-3 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
                pkg.popular
                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg shadow-amber-600/20 hover:from-amber-500 hover:to-amber-400 hover:shadow-amber-500/30'
                  : 'border border-[var(--border)] bg-[var(--surface-overlay)] text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:bg-[var(--surface-raised)]'
              }`}
            >
              {loadingId === pkg.id ? 'Sender...' : 'Kjop'}
            </button>
          </div>
        ))}
      </div>

      {/* Model credit costs */}
      <div className="animate-slide-up">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-faint)]">
          Kreditter per modell
        </h2>
        <div className="overflow-hidden rounded-ds-md border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-raised)]/50">
                <th className="px-4 py-2.5 text-left font-medium text-[var(--text-muted)]">Modell</th>
                <th className="px-4 py-2.5 text-left font-medium text-[var(--text-muted)]">Kategori</th>
                <th className="px-4 py-2.5 text-right font-medium text-[var(--text-muted)]">Kreditter</th>
              </tr>
            </thead>
            <tbody>
              {AI_MODELS.map((m, i) => (
                <tr
                  key={m.id}
                  className={i < AI_MODELS.length - 1 ? 'border-b border-[var(--border)]/50' : ''}
                >
                  <td className="px-4 py-2.5 text-[var(--text-primary)]">{m.name}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        m.tag === 'Rask'
                          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                          : m.tag === 'Balansert'
                            ? 'border-amber-500/20 bg-amber-500/10 text-amber-400'
                            : 'border-violet-500/20 bg-violet-500/10 text-violet-400'
                      }`}
                    >
                      {m.tag}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-[var(--text-primary)]">
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
