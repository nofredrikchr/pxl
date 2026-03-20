'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import ModelSelector from '@/components/ModelSelector'
import SettingsBar, { type Settings } from '@/components/SettingsBar'
import { useCredits } from '@/lib/credits/CreditProvider'
import { AI_MODELS } from '@/lib/ai/models'

function DashboardContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialPrompt = searchParams.get('prompt') || ''
  const { balance } = useCredits()

  const [prompt, setPrompt] = useState(initialPrompt)
  const [model, setModel] = useState('sonnet-4.6')
  const [settings, setSettings] = useState<Settings>({
    aspect_ratio: '1:1',
    resolution: '2K',
    style_preset: 'Fri',
  })
  const [isExpanding, setIsExpanding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedModel = AI_MODELS.find(m => m.id === model)
  const creditCost = selectedModel?.creditCost ?? 2
  const hasInsufficientCredits = balance !== null && balance < creditCost

  async function handleExpand() {
    if (!prompt.trim()) return

    setIsExpanding(true)
    setError(null)

    try {
      const res = await fetch('/api/expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, settings, model }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Feil ved utvidelse av prompt')
        setIsExpanding(false)
        return
      }

      const data = await res.json()

      // Store in sessionStorage for the review page
      sessionStorage.setItem('pxl_generation', JSON.stringify({
        prompt,
        settings,
        model,
        jsonPrompt: data.jsonPrompt,
      }))

      router.push('/generer')
    } catch {
      setError('Nettverksfeil')
      setIsExpanding(false)
    }
  }

  return (
    <main className="relative z-10 mx-auto max-w-5xl px-6 py-10">
      <div className="mb-10 animate-fade-in">
        <h1 className="font-display text-3xl text-[var(--text-primary)]">
          Generer bilde
        </h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Beskriv bildet du vil lage, velg modell og innstillinger
        </p>
      </div>

      <div className="animate-slide-up space-y-7">
        {/* Prompt Input */}
        <div>
          <label
            htmlFor="prompt"
            className="mb-2 block text-sm font-medium text-[var(--text-secondary)]"
          >
            Prompt
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            rows={4}
            placeholder="Beskriv bildet du vil lage..."
            className="w-full resize-y rounded-ds-md border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-faint)] outline-none transition-all duration-200 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30"
          />
        </div>

        {/* Model Selector */}
        <div>
          <label className="mb-2.5 block text-sm font-medium text-[var(--text-secondary)]">
            AI-modell
          </label>
          <ModelSelector value={model} onChange={setModel} />
        </div>

        {/* Settings */}
        <div>
          <label className="mb-2.5 block text-sm font-medium text-[var(--text-secondary)]">
            Innstillinger
          </label>
          <SettingsBar settings={settings} onChange={setSettings} />
        </div>

        {/* Error */}
        {error && (
          <div className="animate-slide-up rounded-ds-md border border-rose-500/20 bg-[var(--error-muted)] px-4 py-3 text-center">
            <p className="text-sm text-rose-400">{error}</p>
          </div>
        )}

        {/* Insufficient credits warning */}
        {hasInsufficientCredits && (
          <div className="animate-slide-up rounded-ds-md border border-amber-500/30 bg-amber-500/[0.07] px-4 py-3 text-center">
            <p className="text-sm text-amber-300">
              Ikke nok kreditter.{' '}
              <Link href="/priser" className="font-medium underline underline-offset-2 hover:text-amber-200">
                Kjøp flere kreditter
              </Link>
            </p>
          </div>
        )}

        {/* Expand Button */}
        <button
          type="button"
          onClick={handleExpand}
          disabled={isExpanding || !prompt.trim() || hasInsufficientCredits}
          className={`w-full rounded-ds-md bg-gradient-to-r from-amber-600 to-amber-500 px-6 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:from-amber-500 hover:to-amber-400 focus-ring disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:from-amber-600 disabled:hover:to-amber-500 ${
            isExpanding ? 'animate-pulse-glow' : 'shadow-lg shadow-amber-600/20 hover:shadow-amber-500/30'
          }`}
        >
          {isExpanding ? 'Utvider prompt...' : `Utvid prompt (${creditCost} ${creditCost === 1 ? 'kreditt' : 'kreditter'})`}
        </button>
      </div>
    </main>
  )
}

export default function DashboardPage() {
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
        <DashboardContent />
      </Suspense>
    </div>
  )
}
