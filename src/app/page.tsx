'use client'

import { Suspense, useState, useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import ModelSelector from '@/components/ModelSelector'
import SettingsBar, { type Settings } from '@/components/SettingsBar'
import JsonEditor from '@/components/JsonEditor'
import ImageResult from '@/components/ImageResult'

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

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Generer bilde</h1>
        <p className="mt-1 text-sm text-gray-400">
          Beskriv bildet du vil lage, velg modell og innstillinger
        </p>
      </div>

      <div className="space-y-6">
        {/* Prompt Input */}
        <div>
          <label
            htmlFor="prompt"
            className="mb-1.5 block text-sm font-medium text-gray-300"
          >
            Prompt
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            rows={4}
            placeholder="Beskriv bildet du vil lage..."
            className="w-full resize-y rounded-lg border border-zinc-800 bg-white/[0.03] px-4 py-3 text-white placeholder-gray-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Model Selector */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            AI-modell
          </label>
          <ModelSelector value={model} onChange={setModel} />
        </div>

        {/* Settings */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
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
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
              advancedMode ? 'bg-blue-600' : 'bg-zinc-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                advancedMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-sm text-gray-300">Avansert modus</span>
        </div>

        {/* JSON Editor (Advanced Mode) */}
        {advancedMode && (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              JSON Prompt Override
            </label>
            <p className="mb-2 text-xs text-gray-500">
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
          className="w-full rounded-lg bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-[#0a0a0a] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGenerating ? 'Genererer...' : 'Generer bilde'}
        </button>

        {/* Result */}
        <ImageResult
          imageUrl={generation.imageUrl}
          status={generation.status}
          error={generation.error}
          onRetry={handleRetry}
        />

        {/* Show expanded JSON after generation (non-advanced mode) */}
        {!advancedMode && generation.jsonPrompt && generation.status === 'completed' && (
          <details className="rounded-lg border border-zinc-800">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-gray-400 hover:text-gray-300">
              Vis utvidet JSON-prompt
            </summary>
            <div className="border-t border-zinc-800">
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
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-blue-500" />
          </div>
        }
      >
        <DashboardContent />
      </Suspense>
    </div>
  )
}
