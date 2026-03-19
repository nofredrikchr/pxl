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
      <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-white/[0.02] py-20">
        <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-zinc-700 border-t-blue-500" />
        <p className="text-sm text-gray-400">
          {status === 'pending' ? 'Forbereder generering...' : 'Genererer bilde...'}
        </p>
        <p className="mt-1 text-xs text-gray-600">
          Dette kan ta opptil 60 sekunder
        </p>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 py-12">
        <svg className="mb-3 h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
        </svg>
        <p className="text-sm font-medium text-red-400">Generering feilet</p>
        {error && <p className="mt-1 max-w-md text-center text-xs text-red-400/70">{error}</p>}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-gray-300 transition hover:border-zinc-500 hover:text-white"
          >
            Prøv igjen
          </button>
        )}
      </div>
    )
  }

  if (status === 'completed' && imageUrl) {
    return (
      <div className="space-y-4">
        <div className="overflow-hidden rounded-xl border border-zinc-800">
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
            className="flex-1 rounded-lg border border-zinc-700 py-2.5 text-center text-sm font-medium text-gray-300 transition hover:border-zinc-500 hover:text-white"
          >
            Last ned
          </a>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="flex-1 rounded-lg border border-zinc-700 py-2.5 text-sm font-medium text-gray-300 transition hover:border-zinc-500 hover:text-white"
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
