'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

interface GenerationResult {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  imageUrl: string | null
  error?: string
}

export default function ResultPage() {
  const { id } = useParams<{ id: string }>()
  const [result, setResult] = useState<GenerationResult>({
    status: 'processing',
    imageUrl: null,
  })
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!id) return

    // Start polling immediately
    async function poll() {
      try {
        const res = await fetch(`/api/generate/${id}/status`)
        if (!res.ok) {
          stopPolling()
          setResult({ status: 'failed', imageUrl: null, error: 'Kunne ikke hente status' })
          return
        }

        const data = await res.json()

        if (data.status === 'completed') {
          stopPolling()
          setResult({ status: 'completed', imageUrl: data.image_url })
        } else if (data.status === 'failed') {
          stopPolling()
          setResult({ status: 'failed', imageUrl: null, error: data.error_message || 'Generering feilet' })
        }
      } catch {
        stopPolling()
        setResult({ status: 'failed', imageUrl: null, error: 'Nettverksfeil' })
      }
    }

    poll()
    pollRef.current = setInterval(poll, 3000)

    return () => stopPolling()
  }, [id, stopPolling])

  const isLoading = result.status === 'pending' || result.status === 'processing'

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <Navbar />
      <main className="relative z-10 mx-auto max-w-4xl px-6 py-10">
        {/* Loading */}
        {isLoading && (
          <div className="animate-fade-in flex flex-col items-center justify-center py-24">
            <div className="relative mb-5">
              <div className="h-12 w-12 rounded-full border-2 border-[var(--border)]" />
              <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-2 border-transparent border-t-amber-500" style={{ animationDuration: '1s' }} />
            </div>
            <p className="text-sm font-medium text-[var(--text-secondary)]">
              Genererer bilde...
            </p>
            <p className="mt-1.5 text-xs text-[var(--text-faint)]">
              Dette kan ta opptil 60 sekunder
            </p>
            <div className="mt-6 h-px w-40 overflow-hidden rounded-full bg-[var(--border)]">
              <div className="animate-loading-bar h-full w-1/3 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
            </div>
          </div>
        )}

        {/* Failed */}
        {result.status === 'failed' && (
          <div className="animate-fade-in flex flex-col items-center justify-center py-24">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10">
              <svg className="h-6 w-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-rose-400">Generering feilet</p>
            {result.error && <p className="mt-1.5 max-w-md text-center text-xs text-rose-400/60">{result.error}</p>}
            <Link
              href="/"
              className="mt-6 rounded-ds-md border border-[var(--border)] px-6 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-all duration-200 hover:border-[var(--border-hover)] hover:text-[var(--text-primary)]"
            >
              Prøv igjen
            </Link>
          </div>
        )}

        {/* Completed */}
        {result.status === 'completed' && result.imageUrl && (
          <div className="animate-slide-up">
            <div className="mb-6">
              <h1 className="font-display text-3xl text-[var(--text-primary)]">
                Ferdig!
              </h1>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Bildet ditt er klart
              </p>
            </div>

            <div className="overflow-hidden rounded-ds-lg border border-[var(--border)] shadow-ds-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.imageUrl}
                alt="Generert bilde"
                className="w-full"
              />
            </div>

            <div className="mt-5 flex gap-3">
              <a
                href={result.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="flex-1 rounded-ds-md border border-[var(--border)] py-3 text-center text-sm font-medium text-[var(--text-secondary)] transition-all duration-200 hover:border-[var(--border-hover)] hover:text-[var(--text-primary)]"
              >
                Last ned
              </a>
              <Link
                href="/"
                className="flex-1 rounded-ds-md bg-gradient-to-r from-amber-600 to-amber-500 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-amber-600/20 transition-all duration-300 hover:from-amber-500 hover:to-amber-400 hover:shadow-amber-500/30"
              >
                Generer nytt bilde
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
