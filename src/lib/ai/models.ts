export type AIProvider = 'anthropic' | 'google'

export interface AIModel {
  id: string
  name: string
  provider: AIProvider
  apiModel: string
  tag: string // 'Rask', 'Balansert', 'Premium'
  creditCost: number
}

export const AI_MODELS: AIModel[] = [
  { id: 'haiku-4.5', name: 'Haiku 4.5', provider: 'anthropic', apiModel: 'claude-haiku-4-5-20251001', tag: 'Rask', creditCost: 1 },
  { id: 'sonnet-4.6', name: 'Sonnet 4.6', provider: 'anthropic', apiModel: 'claude-sonnet-4-6-20250311', tag: 'Balansert', creditCost: 2 },
  { id: 'opus-4.6', name: 'Opus 4.6', provider: 'anthropic', apiModel: 'claude-opus-4-6-20250311', tag: 'Premium', creditCost: 3 },
  { id: 'gemini-flash', name: 'Gemini 3.1 Flash', provider: 'google', apiModel: 'gemini-3.1-flash', tag: 'Rask', creditCost: 1 },
  { id: 'gemini-pro', name: 'Gemini 3.1 Pro', provider: 'google', apiModel: 'gemini-3.1-pro', tag: 'Premium', creditCost: 3 },
]

export function getModel(id: string): AIModel | undefined {
  return AI_MODELS.find(m => m.id === id)
}

export function getCreditCost(modelId: string): number {
  return getModel(modelId)?.creditCost ?? 2
}
