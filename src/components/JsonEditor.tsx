'use client'

interface JsonEditorProps {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
}

export default function JsonEditor({ value, onChange, readOnly }: JsonEditorProps) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-black/40">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
        <span className="text-xs font-medium text-gray-400">
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
            className="text-xs text-blue-400 transition hover:text-blue-300"
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
        className="h-[340px] w-full resize-y bg-transparent p-4 font-mono text-sm leading-relaxed text-green-300 outline-none placeholder-gray-600"
        placeholder='{ "prompt": "..." }'
      />
    </div>
  )
}
