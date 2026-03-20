'use client'

import { Suspense, useState, useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import ModelSelector from '@/components/ModelSelector'
import SettingsBar, { type Settings } from '@/components/SettingsBar'
import JsonEditor from '@/components/JsonEditor'
import ImageResult from '@/components/ImageResult'
import { useCredits } from '@/lib/credits/CreditProvider'
import { AI_MODELS } from '@/lib/ai/models'

interface GenerationState {
  id: string | null
  status: 'idle' | 'pending' | 'processing' | 'completed' | 'failed'
  imageUrl: string | null
  error?: string
  jsonPrompt: string
}

function DashboardContent() {
  const searchParams = useSearchParams()
  const initialPrompt = searchParams.get('prompt') || ''
  const { balance, refreshBalance } = useCredits()

  const [prompt, setPrompt] = useState(initialPrompt)
  const [model, setModel] = useState('sonnet-4.6')
  const [settings, setSettings] = useState<Settings>({
    aspect_ratio: '1:1',
    resolution: '2K',
    style_preset: 'Fri',
  })
  const [advancedMode, setAdvancedMode] = useState(false)
  const [jsonOverride, setJsonOverride] = useState('')
  const [generation, setGeneration] = useState<GenerationState>({
    id: null,
    status: 'idle',
    imageUrl: null,
    jsonPrompt: '',
  })

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => stopPolling()
  }, [stopPolling])

  const pollStatus = useCallback(
    (generationId: string) => {
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/generate/${generationId}/status`)
          if (!res.ok) {
            stopPolling()
            setGeneration(prev => ({
              ...prev,
              status: 'failed',
              error: 'Kunne ikke hente status',
            }))
            return
          }

          const data = await res.json()

          if (data.status === 'completed') {
            stopPolling()
            setGeneration(prev => ({
              ...prev,
              status: 'completed',
              imageUrl: data.image_url,
            }))
          } else if (data.status === 'failed') {
            stopPolling()
            setGeneration(prev => ({
              ...prev,
              status: 'failed',
              error: data.error_message || 'Generering feilet',
            }))
          }
        } catch {
          stopPolling()
          setGeneration(prev => ({
            ...prev,
            status: 'failed',
            error: 'Nettverksfeil under polling',
          }))
        }
      }, 3000)
    },
    [stopPolling]
  )

  async function handleGenerate() {
    if (!prompt.trim()) return

    stopPolling()
    setGeneration({
      id: null,
      status: 'pending',
      imageUrl: null,
      jsonPrompt: '',
    })

    try {
      const body: Record<string, unknown> = { prompt, settings, model }

      if (advancedMode && jsonOverride.trim()) {
        body.jsonOverride = jsonOverride
      }

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        if (data.code === 'INSUFFICIENT_CREDITS') {
          setGeneration(prev => ({
            ...prev,
            status: 'failed',
            error: 'INSUFFICIENT_CREDITS',
          }))
          return
        }
        setGeneration(prev => ({
          ...prev,
          status: 'failed',
          error: data.error || 'Feil ved opprettelse',
        }))
        return
      }

      const data = await res.json()

      const jsonStr = data.json_prompt
        ? JSON.stringify(data.json_prompt, null, 2)
        : ''

      setGeneration({
        id: data.id,
        status: data.status || 'processing',
        imageUrl: data.image_url || null,
        jsonPrompt: jsonStr,
      })

      if (advancedMode && jsonStr && !jsonOverride.trim()) {
        setJsonOverride(jsonStr)
      }

      // Refresh credit balance after deduction
      refreshBalance()

      if (data.status !== 'completed' && data.status !== 'failed') {
        pollStatus(data.id)
      }
    } catch {
      setGeneration(prev => ({
        ...prev,
        status: 'failed',
        error: 'Nettverksfeil',
      }))
    }
  }

  function handleRetry() {
    handleGenerate()
  }

  const isGenerating =
    generation.status === 'pending' || generation.status === 'processing'

  const selectedModel = AI_MODELS.find(m => m.id === model)
  const creditCost = selectedModel?.creditCost ?? 2
  const isInsufficientCredits = generation.error === 'INSUFFICIENT_CREDITS'

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

        {/* Advanced Mode Toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={advancedMode}
            onClick={() => setAdvancedMode(!advancedMode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
              advancedMode ? 'bg-amber-600' : 'bg-[var(--surface-overlay)]'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                advancedMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-sm text-[var(--text-muted)]">Avansert modus</span>
        </div>

        {/* JSON Editor (Advanced Mode) */}
        {advancedMode && (
          <div className="animate-slide-up">
            <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
              JSON Prompt Override
            </label>
            <p className="mb-2.5 text-xs text-[var(--text-faint)]">
              Rediger den utvidede JSON-prompten direkte. La stå tom for automatisk utvidelse.
            </p>
            <JsonEditor
              value={jsonOverride || generation.jsonPrompt}
              onChange={setJsonOverride}
            />
          </div>
        )}

        {/* Generate Button */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className={`w-full rounded-ds-md bg-gradient-to-r from-amber-600 to-amber-500 px-6 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:from-amber-500 hover:to-amber-400 focus-ring disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:from-amber-600 disabled:hover:to-amber-500 ${
            isGenerating ? 'animate-pulse-glow' : 'shadow-lg shadow-amber-600/20 hover:shadow-amber-500/30'
          }`}
        >
          {isGenerating ? 'Genererer...' : `Generer bilde (${creditCost} ${creditCost === 1 ? 'kreditt' : 'kreditter'})`}
        </button>

        {/* Insufficient credits warning */}
        {isInsufficientCredits && (
          <div className="animate-slide-up rounded-ds-md border border-amber-500/30 bg-amber-500/[0.07] px-4 py-3 text-center">
            <p className="text-sm text-amber-300">
              Ikke nok kreditter.{' '}
              <Link href="/priser" className="font-medium underline underline-offset-2 hover:text-amber-200">
                Kjop flere kreditter
              </Link>
            </p>
          </div>
        )}

        {/* Result */}
        <ImageResult
          imageUrl={generation.imageUrl}
          status={isInsufficientCredits ? 'idle' : generation.status}
          error={isInsufficientCredits ? undefined : generation.error}
          onRetry={handleRetry}
        />

        {/* Show expanded JSON after generation (non-advanced mode) */}
        {!advancedMode && generation.jsonPrompt && generation.status === 'completed' && (
          <details className="rounded-ds-md border border-[var(--border)] transition-colors duration-200">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-[var(--text-muted)] transition-colors duration-200 hover:text-[var(--text-secondary)]">
              Vis utvidet JSON-prompt
            </summary>
            <div className="border-t border-[var(--border)]">
              <JsonEditor
                value={generation.jsonPrompt}
                onChange={() => {}}
                readOnly
              />
            </div>
          </details>
        )}
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
