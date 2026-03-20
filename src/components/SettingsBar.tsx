'use client'

export interface Settings {
  aspect_ratio: string
  resolution: string
  style_preset: string
}

interface SettingsBarProps {
  settings: Settings
  onChange: (settings: Settings) => void
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <div className="flex-1">
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text-faint)]">
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full appearance-none rounded-ds-md border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-all duration-200 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} className="bg-[var(--surface-raised)]">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default function SettingsBar({ settings, onChange }: SettingsBarProps) {
  function update(key: keyof Settings, value: string) {
    onChange({ ...settings, [key]: value })
  }

  return (
    <div className="flex gap-3">
      <SelectField
        label="Bildeformat"
        value={settings.aspect_ratio}
        options={[
          { value: '1:1', label: '1:1' },
          { value: '4:5', label: '4:5' },
          { value: '9:16', label: '9:16' },
          { value: '16:9', label: '16:9' },
        ]}
        onChange={v => update('aspect_ratio', v)}
      />
      <SelectField
        label="Opplosning"
        value={settings.resolution}
        options={[
          { value: '1K', label: '1K' },
          { value: '2K', label: '2K' },
          { value: '4K', label: '4K' },
        ]}
        onChange={v => update('resolution', v)}
      />
      <SelectField
        label="Stilpreset"
        value={settings.style_preset}
        options={[
          { value: 'Portrett', label: 'Portrett' },
          { value: 'Landskap', label: 'Landskap' },
          { value: 'Produkt', label: 'Produkt' },
          { value: 'Fri', label: 'Fri' },
        ]}
        onChange={v => update('style_preset', v)}
      />
    </div>
  )
}
