'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import JsonEditor from '@/components/JsonEditor'

interface Generation {
  id: string
  prompt: string
  json_prompt: object | null
  image_url: string | null
  model_used: string
  settings: {
    aspect_ratio: string
    resolution: string
    style_preset: string
  }
  status: string
  error_message?: string
  created_at: string
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('nb-NO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function GalleryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [generation, setGeneration] = useState<Generation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showJson, setShowJson] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function fetchGeneration() {
      try {
        const res = await fetch(`/api/gallery/${id}`)
        if (!res.ok) {
          setError('Kunne ikke hente generering')
          return
        }
        const data = await res.json()
        setGeneration(data)
      } catch {
        setError('Nettverksfeil')
      } finally {
        setLoading(false)
      }
    }

    fetchGeneration()
  }, [id])

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }

    setDeleting(true)
    try {
      const res = await fetch(`/api/gallery/${id}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/gallery')
      } else {
        setError('Kunne ikke slette')
        setDeleting(false)
        setConfirmDelete(false)
      }
    } catch {
      setError('Nettverksfeil under sletting')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-blue-500" />
        </div>
      </div>
    )
  }

  if (error || !generation) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 py-8">
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-6 py-4">
            <p className="text-sm text-red-400">{error || 'Ikke funnet'}</p>
          </div>
          <Link
            href="/gallery"
            className="mt-4 inline-block text-sm text-gray-400 hover:text-white"
          >
            &larr; Tilbake til galleri
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Back Link */}
        <Link
          href="/gallery"
          className="mb-6 inline-flex items-center gap-1 text-sm text-gray-400 transition hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Tilbake til galleri
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Image */}
          <div>
            {generation.image_url ? (
              <div className="overflow-hidden rounded-xl border border-zinc-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={generation.image_url}
                  alt={generation.prompt}
                  className="w-full"
                />
              </div>
            ) : (
              <div className="flex aspect-square items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
                <p className="text-sm text-gray-600">
                  {generation.status === 'processing'
                    ? 'Genererer...'
                    : generation.status === 'failed'
                    ? 'Generering feilet'
                    : 'Ingen bilde'}
                </p>
              </div>
            )}
          </div>

          {/* Details Sidebar */}
          <div className="space-y-6">
            {/* Prompt */}
            <div>
              <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Prompt
              </h2>
              <p className="text-sm leading-relaxed text-gray-200">
                {generation.prompt}
              </p>
            </div>

            {/* Settings */}
            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Innstillinger
              </h2>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Modell</span>
                  <span className="text-gray-200">{generation.model_used}</span>
                </div>
                {generation.settings && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Bildeformat</span>
                      <span className="text-gray-200">
                        {generation.settings.aspect_ratio}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Opplosning</span>
                      <span className="text-gray-200">
                        {generation.settings.resolution}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Stilpreset</span>
                      <span className="text-gray-200">
                        {generation.settings.style_preset}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Date */}
            <div>
              <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Opprettet
              </h2>
              <p className="text-sm text-gray-300">
                {formatDate(generation.created_at)}
              </p>
            </div>

            {/* Status */}
            {generation.status === 'failed' && generation.error_message && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
                <p className="text-xs font-medium text-red-400">Feil</p>
                <p className="mt-0.5 text-xs text-red-400/70">
                  {generation.error_message}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              <Link
                href={`/?prompt=${encodeURIComponent(generation.prompt)}`}
                className="flex w-full items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-gray-200"
              >
                Gjenbruk prompt
              </Link>

              {generation.image_url && (
                <a
                  href={generation.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="flex w-full items-center justify-center rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:border-zinc-500 hover:text-white"
                >
                  Last ned
                </a>
              )}

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className={`w-full rounded-lg border px-4 py-2.5 text-sm font-medium transition disabled:opacity-50 ${
                  confirmDelete
                    ? 'border-red-500 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                    : 'border-zinc-700 text-gray-300 hover:border-red-500/50 hover:text-red-400'
                }`}
              >
                {deleting
                  ? 'Sletter...'
                  : confirmDelete
                  ? 'Bekreft sletting'
                  : 'Slett'}
              </button>
            </div>

            {/* JSON Prompt */}
            {generation.json_prompt && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowJson(!showJson)}
                  className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 transition hover:text-gray-300"
                >
                  <svg
                    className={`h-3 w-3 transition ${showJson ? 'rotate-90' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m8.25 4.5 7.5 7.5-7.5 7.5"
                    />
                  </svg>
                  JSON Prompt
                </button>
                {showJson && (
                  <div className="mt-2">
                    <JsonEditor
                      value={JSON.stringify(generation.json_prompt, null, 2)}
                      onChange={() => {}}
                      readOnly
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
