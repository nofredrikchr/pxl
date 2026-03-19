import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getModel } from './models'
import { SYSTEM_PROMPT } from './system-prompt'

interface ExpandPromptInput {
  prompt: string
  settings: {
    aspect_ratio: string
    resolution: string
    style_preset: string
  }
  modelId: string
}

export async function expandPrompt(input: ExpandPromptInput): Promise<object> {
  const model = getModel(input.modelId)
  if (!model) throw new Error(`Unknown model: ${input.modelId}`)

  const userMessage = `Prompt: "${input.prompt}"
Settings: aspect_ratio=${input.settings.aspect_ratio}, resolution=${input.settings.resolution}, style_preset=${input.settings.style_preset}`

  let responseText: string

  if (model.provider === 'anthropic') {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await client.messages.create({
      model: model.apiModel,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })
    const textBlock = response.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') throw new Error('No text response from Anthropic')
    responseText = textBlock.text
  } else {
    // Google Gemini
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)
    const geminiModel = genAI.getGenerativeModel({
      model: model.apiModel,
      systemInstruction: SYSTEM_PROMPT,
    })
    const result = await geminiModel.generateContent(userMessage)
    responseText = result.response.text()
  }

  // Parse and validate JSON
  // Strip any markdown code fences if model returned them anyway
  responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  try {
    return JSON.parse(responseText)
  } catch {
    throw new Error(`AI returned invalid JSON: ${responseText.substring(0, 200)}`)
  }
}
