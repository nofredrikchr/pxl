'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import JsonEditor from '@/components/JsonEditor'
import { useCredits } from '@/lib/credits/CreditProvider'
import { AI_MODELS } from '@/lib/ai/models'

interface GenerationData {
  prompt: string
  settings: {
    aspect_ratio: string
    resolution: string
    style_preset: string
  }
  model: string
  jsonPrompt: object
}

export default function GenererPage() {
  const router = useRouter()
  const { balance, refreshBalance } = useCredits()
  const [data, setData] = useState<GenerationData | null>(null)
  const [jsonText, setJsonText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('pxl_generation')
    if (!stored) {
      router.replace('/')
      return
    }
    const parsed = JSON.parse(stored) as GenerationData
    setData(parsed)
    setJsonText(JSON.stringify(parsed.jsonPrompt, null, 2))
  }, [router])

  if (!data) {
    return (
      <div className="min-h-screen bg-[var(--surface)]">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-amber-500" />
        </div>
      </div>
    )
  }

  const selectedModel = AI_MODELS.find(m => m.id === data.model)
  const creditCost = selectedModel?.creditCost ?? 2
  const hasInsufficientCredits = balance !== null && balance < creditCost

  async function handleGenerate() {
    setIsGenerating(true)
    setError(null)

    try {
      let jsonOverride: object
      try {
        jsonOverride = JSON.parse(jsonText)
      } catch {
        setError('Ugyldig JSON. Vennligst sjekk syntaksen.')
        setIsGenerating(false)
        return
      }

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: data!.prompt,
          settings: data!.settings,
          model: data!.model,
          jsonOverride,
        }),
      })

      if (!res.ok) {
        const result = await res.json()
        if (result.code === 'INSUFFICIENT_CREDITS') {
          setError('Ikke nok kreditter.')
        } else {
          setError(result.error || 'Feil ved generering')
        }
        setIsGenerating(false)
        return
      }

      const result = await res.json()
      refreshBalance()

      // Clean up sessionStorage
      sessionStorage.removeItem('pxl_generation')

      // Navigate to result page
      router.push(`/generer/${result.id}`)
    } catch {
      setError('Nettverksfeil')
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <Navbar />
      <main className="relative z-10 mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 animate-fade-in">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] transition-colors duration-200 hover:text-[var(--text-primary)]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Tilbake
          </Link>
          <h1 className="font-display text-3xl text-[var(--text-primary)]">
            Gjennomgå prompt
          </h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Rediger den utvidede prompten før du genererer bildet
          </p>
        </div>

        <div className="animate-slide-up space-y-6">
          {/* Original prompt summary */}
          <div className="rounded-ds-md border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-faint)]">
              Opprinnelig prompt
            </p>
            <p className="text-sm text-[var(--text-secondary)]">{data.prompt}</p>
            <div className="mt-2 flex gap-3 text-xs text-[var(--text-faint)]">
              <span>{selectedModel?.name}</span>
              <span>{data.settings.aspect_ratio}</span>
              <span>{data.settings.resolution}</span>
              <span>{data.settings.style_preset}</span>
            </div>
          </div>

          {/* Editable JSON */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
              Utvidet prompt
            </label>
            <p className="mb-2.5 text-xs text-[var(--text-faint)]">
              Rediger JSON-prompten for å justere detaljene. Endringer reflekteres direkte i det genererte bildet.
            </p>
            <JsonEditor value={jsonText} onChange={setJsonText} />
          </div>

          {/* Error */}
          {error && (
            <div className="animate-slide-up rounded-ds-md border border-rose-500/20 bg-[var(--error-muted)] px-4 py-3 text-center">
              <p className="text-sm text-rose-400">
                {error}
                {error === 'Ikke nok kreditter.' && (
                  <>
                    {' '}
                    <Link href="/priser" className="font-medium underline underline-offset-2 hover:text-rose-300">
                      Kjøp flere
                    </Link>
                  </>
                )}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Link
              href="/"
              className="flex-1 rounded-ds-md border border-[var(--border)] py-3.5 text-center text-sm font-medium text-[var(--text-secondary)] transition-all duration-200 hover:border-[var(--border-hover)] hover:text-[var(--text-primary)]"
            >
              Avbryt
            </Link>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || hasInsufficientCredits}
              className={`flex-[2] rounded-ds-md bg-gradient-to-r from-amber-600 to-amber-500 px-6 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:from-amber-500 hover:to-amber-400 focus-ring disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:from-amber-600 disabled:hover:to-amber-500 ${
                isGenerating ? 'animate-pulse-glow' : 'shadow-lg shadow-amber-600/20 hover:shadow-amber-500/30'
              }`}
            >
              {isGenerating ? 'Genererer...' : `Generer bilde (${creditCost} ${creditCost === 1 ? 'kreditt' : 'kreditter'})`}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
