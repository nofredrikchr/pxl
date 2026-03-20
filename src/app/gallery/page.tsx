'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

interface Generation {
  id: string
  prompt: string
  image_url: string | null
  model_used: string
  status: string
  created_at: string
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('nb-NO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str
  return str.slice(0, max) + '...'
}

export default function GalleryPage() {
  const [generations, setGenerations] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchGallery() {
      try {
        const res = await fetch('/api/gallery')
        if (!res.ok) {
          setError('Kunne ikke hente galleri')
          return
        }
        const data = await res.json()
        setGenerations(data)
      } catch {
        setError('Nettverksfeil')
      } finally {
        setLoading(false)
      }
    }

    fetchGallery()
  }, [])

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <Navbar />

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-10">
        <div className="mb-10 animate-fade-in">
          <h1 className="font-display text-3xl text-[var(--text-primary)]">
            Galleri
          </h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Dine genererte bilder
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-amber-500" />
          </div>
        )}

        {error && (
          <div className="animate-fade-in rounded-ds-lg border border-rose-500/20 bg-rose-500/[0.06] px-6 py-4">
            <p className="text-sm text-rose-400">{error}</p>
          </div>
        )}

        {!loading && !error && generations.length === 0 && (
          <div className="animate-fade-in flex flex-col items-center justify-center py-24">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface-raised)]">
              <svg
                className="h-7 w-7 text-[var(--text-faint)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
                />
              </svg>
            </div>
            <p className="text-lg font-medium text-[var(--text-secondary)]">
              Ingen genererte bilder enda
            </p>
            <p className="mt-1.5 text-sm text-[var(--text-faint)]">
              Kom i gang ved å lage ditt første bilde
            </p>
            <Link
              href="/"
              className="mt-7 rounded-ds-md bg-gradient-to-r from-amber-600 to-amber-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-600/20 transition-all duration-300 hover:from-amber-500 hover:to-amber-400 hover:shadow-amber-500/30"
            >
              Generer bilde
            </Link>
          </div>
        )}

        {!loading && !error && generations.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {generations.map((gen, i) => (
              <Link
                key={gen.id}
                href={`/gallery/${gen.id}`}
                className="group animate-slide-up overflow-hidden rounded-ds-lg border border-[var(--border)] bg-[var(--surface-raised)]/30 transition-all duration-300 hover:border-amber-500/30 hover:shadow-glow"
                style={{ animationDelay: `${i * 0.05}s`, animationFillMode: 'both' }}
              >
                <div className="aspect-square bg-[var(--surface-raised)]">
                  {gen.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={gen.image_url}
                      alt={truncate(gen.prompt, 60)}
                      className="h-full w-full object-cover transition-transform duration-500 ease-out-expo group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="text-xs text-[var(--text-faint)]">
                        {gen.status === 'processing'
                          ? 'Genererer...'
                          : gen.status === 'failed'
                          ? 'Feilet'
                          : 'Ingen bilde'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-3.5">
                  <p className="text-sm font-medium text-[var(--text-secondary)] transition-colors duration-200 group-hover:text-[var(--text-primary)]">
                    {truncate(gen.prompt, 60)}
                  </p>
                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-faint)]">
                      {gen.model_used}
                    </span>
                    <span className="text-[11px] text-[var(--text-faint)]">
                      {formatDate(gen.created_at)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
