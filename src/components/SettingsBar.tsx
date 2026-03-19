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
      <label className="mb-1.5 block text-xs font-medium text-gray-400">
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg border border-zinc-800 bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} className="bg-[#111]">
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
