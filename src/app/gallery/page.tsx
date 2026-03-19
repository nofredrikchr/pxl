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
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Galleri</h1>
          <p className="mt-1 text-sm text-gray-400">
            Dine genererte bilder
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-blue-500" />
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-6 py-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {!loading && !error && generations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <svg
              className="mb-4 h-12 w-12 text-gray-600"
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
            <p className="text-lg font-medium text-gray-400">
              Ingen genererte bilder enda
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Kom i gang ved å lage ditt første bilde
            </p>
            <Link
              href="/"
              className="mt-6 rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-gray-200"
            >
              Generer bilde
            </Link>
          </div>
        )}

        {!loading && !error && generations.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {generations.map(gen => (
              <Link
                key={gen.id}
                href={`/gallery/${gen.id}`}
                className="group overflow-hidden rounded-xl border border-zinc-800 bg-white/[0.02] transition hover:border-zinc-600 hover:bg-white/[0.04]"
              >
                <div className="aspect-square bg-zinc-900">
                  {gen.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={gen.image_url}
                      alt={truncate(gen.prompt, 60)}
                      className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="text-xs text-gray-600">
                        {gen.status === 'processing'
                          ? 'Genererer...'
                          : gen.status === 'failed'
                          ? 'Feilet'
                          : 'Ingen bilde'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-200">
                    {truncate(gen.prompt, 60)}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-gray-500">{gen.model_used}</span>
                    <span className="text-xs text-gray-600">
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
