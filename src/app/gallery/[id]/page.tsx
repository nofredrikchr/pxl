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
      <div className="min-h-screen bg-[var(--surface)]">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-amber-500" />
        </div>
      </div>
    )
  }

  if (error || !generation) {
    return (
      <div className="min-h-screen bg-[var(--surface)]">
        <Navbar />
        <main className="relative z-10 mx-auto max-w-3xl px-4 py-10">
          <div className="rounded-ds-lg border border-rose-500/20 bg-rose-500/[0.06] px-6 py-4">
            <p className="text-sm text-rose-400">{error || 'Ikke funnet'}</p>
          </div>
          <Link
            href="/gallery"
            className="mt-4 inline-block text-sm text-[var(--text-muted)] transition-colors duration-200 hover:text-[var(--text-primary)]"
          >
            &larr; Tilbake til galleri
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <Navbar />

      <main className="relative z-10 mx-auto max-w-4xl px-4 py-10">
        {/* Back Link */}
        <Link
          href="/gallery"
          className="mb-7 inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] transition-colors duration-200 hover:text-[var(--text-primary)]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Tilbake til galleri
        </Link>

        <div className="animate-fade-in grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Image */}
          <div>
            {generation.image_url ? (
              <div className="overflow-hidden rounded-ds-lg border border-[var(--border)] shadow-ds-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={generation.image_url}
                  alt={generation.prompt}
                  className="w-full"
                />
              </div>
            ) : (
              <div className="flex aspect-square items-center justify-center rounded-ds-lg border border-[var(--border)] bg-[var(--surface-raised)]">
                <p className="text-sm text-[var(--text-faint)]">
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
          <div className="animate-slide-up-delayed space-y-6">
            {/* Prompt */}
            <div>
              <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text-faint)]">
                Prompt
              </h2>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                {generation.prompt}
              </p>
            </div>

            {/* Settings */}
            <div>
              <h2 className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text-faint)]">
                Innstillinger
              </h2>
              <div className="space-y-2">
                <DetailRow label="Modell" value={generation.model_used} />
                {generation.settings && (
                  <>
                    <DetailRow label="Bildeformat" value={generation.settings.aspect_ratio} />
                    <DetailRow label="Oppløsning" value={generation.settings.resolution} />
                    <DetailRow label="Stilpreset" value={generation.settings.style_preset} />
                  </>
                )}
              </div>
            </div>

            {/* Date */}
            <div>
              <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text-faint)]">
                Opprettet
              </h2>
              <p className="text-sm text-[var(--text-muted)]">
                {formatDate(generation.created_at)}
              </p>
            </div>

            {/* Status */}
            {generation.status === 'failed' && generation.error_message && (
              <div className="rounded-ds-md border border-rose-500/20 bg-rose-500/[0.06] px-4 py-3">
                <p className="text-xs font-medium text-rose-400">Feil</p>
                <p className="mt-1 text-xs text-rose-400/60">
                  {generation.error_message}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2.5 pt-2">
              <Link
                href={`/?prompt=${encodeURIComponent(generation.prompt)}`}
                className="flex w-full items-center justify-center rounded-ds-md bg-gradient-to-r from-amber-600 to-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-600/20 transition-all duration-300 hover:from-amber-500 hover:to-amber-400 hover:shadow-amber-500/30"
              >
                Gjenbruk prompt
              </Link>

              {generation.image_url && (
                <a
                  href={generation.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="flex w-full items-center justify-center rounded-ds-md border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-all duration-200 hover:border-[var(--border-hover)] hover:text-[var(--text-primary)]"
                >
                  Last ned
                </a>
              )}

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className={`w-full rounded-ds-md border px-4 py-2.5 text-sm font-medium transition-all duration-200 disabled:opacity-50 ${
                  confirmDelete
                    ? 'border-rose-500/40 bg-rose-500/10 text-rose-400 hover:bg-rose-500/15'
                    : 'border-[var(--border)] text-[var(--text-muted)] hover:border-rose-500/30 hover:text-rose-400'
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
                  className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text-faint)] transition-colors duration-200 hover:text-[var(--text-muted)]"
                >
                  <svg
                    className={`h-3 w-3 transition-transform duration-200 ${showJson ? 'rotate-90' : ''}`}
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
                  <div className="mt-3 animate-slide-up">
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className="font-medium text-[var(--text-secondary)]">{value}</span>
    </div>
  )
}
