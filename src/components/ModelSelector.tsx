'use client'

import Image from 'next/image'
import { AI_MODELS, type AIModel } from '@/lib/ai/models'

interface ModelSelectorProps {
  value: string
  onChange: (id: string) => void
}

function TagBadge({ tag }: { tag: string }) {
  const colors: Record<string, string> = {
    Rask: 'bg-green-500/15 text-green-400 border-green-500/30',
    Balansert: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    Premium: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  }
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
        colors[tag] || 'bg-zinc-700 text-gray-300 border-zinc-600'
      }`}
    >
      {tag}
    </span>
  )
}

function ProviderIcon({ provider }: { provider: string }) {
  const src = provider === 'anthropic' ? '/icons/anthropic.svg' : '/icons/google.svg'
  return (
    <Image
      src={src}
      alt={provider}
      width={18}
      height={18}
      className="flex-shrink-0"
    />
  )
}

export default function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const anthropicModels = AI_MODELS.filter(m => m.provider === 'anthropic')
  const googleModels = AI_MODELS.filter(m => m.provider === 'google')

  function renderModel(model: AIModel) {
    const isSelected = value === model.id
    return (
      <button
        key={model.id}
        type="button"
        onClick={() => onChange(model.id)}
        className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition ${
          isSelected
            ? 'border-blue-500 bg-blue-500/10 text-white'
            : 'border-zinc-800 bg-white/[0.02] text-gray-300 hover:border-zinc-600 hover:bg-white/[0.04]'
        }`}
      >
        <ProviderIcon provider={model.provider} />
        <span className="flex-1 text-sm font-medium">{model.name}</span>
        <TagBadge tag={model.tag} />
      </button>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          Anthropic
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {anthropicModels.map(renderModel)}
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          Google
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {googleModels.map(renderModel)}
        </div>
      </div>
    </div>
  )
}
