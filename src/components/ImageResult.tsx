'use client'

interface ImageResultProps {
  imageUrl: string | null
  status: string
  error?: string
  onRetry?: () => void
}

export default function ImageResult({ imageUrl, status, error, onRetry }: ImageResultProps) {
  if (status === 'idle') return null

  if (status === 'pending' || status === 'processing') {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center rounded-ds-lg border border-[var(--border)] bg-[var(--surface-raised)]/30 py-20">
        {/* Amber spinner */}
        <div className="relative mb-5">
          <div className="h-10 w-10 rounded-full border-2 border-[var(--border)]" />
          <div className="absolute inset-0 h-10 w-10 animate-spin rounded-full border-2 border-transparent border-t-amber-500" style={{ animationDuration: '1s' }} />
        </div>
        <p className="text-sm font-medium text-[var(--text-secondary)]">
          {status === 'pending' ? 'Forbereder generering...' : 'Genererer bilde...'}
        </p>
        <p className="mt-1.5 text-xs text-[var(--text-faint)]">
          Dette kan ta opptil 60 sekunder
        </p>
        {/* Loading bar */}
        <div className="mt-6 h-px w-40 overflow-hidden rounded-full bg-[var(--border)]">
          <div className="animate-loading-bar h-full w-1/3 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
        </div>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center rounded-ds-lg border border-rose-500/20 bg-[var(--error-muted)] py-12">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/10">
          <svg className="h-5 w-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-rose-400">Generering feilet</p>
        {error && <p className="mt-1.5 max-w-md text-center text-xs text-rose-400/60">{error}</p>}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 rounded-ds-md border border-[var(--border)] px-5 py-2 text-sm font-medium text-[var(--text-secondary)] transition-all duration-200 hover:border-[var(--border-hover)] hover:text-[var(--text-primary)]"
          >
            Prøv igjen
          </button>
        )}
      </div>
    )
  }

  if (status === 'completed' && imageUrl) {
    return (
      <div className="animate-slide-up space-y-4">
        <div className="overflow-hidden rounded-ds-lg border border-[var(--border)] shadow-ds-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Generert bilde"
            className="w-full"
          />
        </div>
        <div className="flex gap-3">
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="flex-1 rounded-ds-md border border-[var(--border)] py-2.5 text-center text-sm font-medium text-[var(--text-secondary)] transition-all duration-200 hover:border-[var(--border-hover)] hover:text-[var(--text-primary)]"
          >
            Last ned
          </a>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="flex-1 rounded-ds-md border border-[var(--border)] py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-all duration-200 hover:border-[var(--border-hover)] hover:text-[var(--text-primary)]"
            >
              Generer på nytt
            </button>
          )}
        </div>
      </div>
    )
  }

  return null
}
