'use client'

interface JsonEditorProps {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
}

export default function JsonEditor({ value, onChange, readOnly }: JsonEditorProps) {
  return (
    <div className="overflow-hidden rounded-ds-md border border-[var(--border)] bg-[var(--surface)]/80">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2">
        <span className="font-mono text-[11px] font-medium text-[var(--text-faint)]">
          JSON Prompt {readOnly ? '(skrivebeskyttet)' : ''}
        </span>
        {!readOnly && (
          <button
            type="button"
            onClick={() => {
              try {
                const parsed = JSON.parse(value)
                onChange(JSON.stringify(parsed, null, 2))
              } catch {
                // leave as-is if invalid
              }
            }}
            className="text-[11px] font-medium text-amber-500 transition-colors duration-200 hover:text-amber-400"
          >
            Formater
          </button>
        )}
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        readOnly={readOnly}
        spellCheck={false}
        className="h-[340px] w-full resize-y bg-transparent p-4 font-mono text-sm leading-relaxed text-lime-300/90 outline-none placeholder-[var(--text-faint)]"
        placeholder='{ "prompt": "..." }'
      />
    </div>
  )
}
