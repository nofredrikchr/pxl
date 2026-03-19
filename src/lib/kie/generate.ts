const KIE_API_URL = 'https://api.kie.ai/api/v1/jobs/createTask'

interface CreateTaskInput {
  jsonPrompt: object
  aspectRatio?: string
  resolution?: string
  outputFormat?: string
  imageInput?: string[]
}

interface CreateTaskResult {
  taskId: string
}

export async function createKieTask(input: CreateTaskInput): Promise<CreateTaskResult> {
  const apiKey = process.env.KIE_API_KEY
  if (!apiKey) throw new Error('KIE_API_KEY not set')

  const promptString = JSON.stringify(input.jsonPrompt)

  const payload = {
    model: 'nano-banana-2',
    input: {
      prompt: promptString,
      aspect_ratio: input.aspectRatio || 'auto',
      resolution: input.resolution || '1K',
      output_format: input.outputFormat || 'jpg',
      ...(input.imageInput && { image_input: input.imageInput }),
    },
  }

  const response = await fetch(KIE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Kie.ai createTask failed (${response.status}): ${text}`)
  }

  const result = await response.json()
  const taskId = result?.data?.taskId
  if (!taskId) throw new Error('No taskId returned from Kie.ai')

  return { taskId }
}
