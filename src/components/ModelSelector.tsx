'use client'

import Image from 'next/image'
import { AI_MODELS, type AIModel } from '@/lib/ai/models'

interface ModelSelectorProps {
  value: string
  onChange: (id: string) => void
}

function TagBadge({ tag }: { tag: string }) {
  const styles: Record<string, string> = {
    Rask: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Balansert: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Premium: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  }
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
        styles[tag] || 'bg-[var(--surface-overlay)] text-[var(--text-muted)] border-[var(--border)]'
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
      width={16}
      height={16}
      className="flex-shrink-0 opacity-60"
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
        className={`group flex items-center gap-3 rounded-ds-md border px-4 py-3 text-left transition-all duration-200 ${
          isSelected
            ? 'border-amber-500/50 bg-amber-500/[0.07] text-[var(--text-primary)] shadow-glow'
            : 'border-[var(--border)] bg-[var(--surface-raised)]/50 text-[var(--text-secondary)] hover:border-[var(--border-hover)] hover:bg-[var(--surface-raised)]'
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
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text-faint)]">
          Anthropic
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {anthropicModels.map(renderModel)}
        </div>
      </div>
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text-faint)]">
          Google
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {googleModels.map(renderModel)}
        </div>
      </div>
    </div>
  )
}
