const KIE_POLL_URL = 'https://api.kie.ai/api/v1/jobs/recordInfo'

interface PollResult {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  imageUrl?: string
  error?: string
}

export async function pollKieTask(taskId: string): Promise<PollResult> {
  const apiKey = process.env.KIE_API_KEY
  if (!apiKey) throw new Error('KIE_API_KEY not set')

  const url = `${KIE_POLL_URL}?taskId=${encodeURIComponent(taskId)}`
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Kie.ai poll failed (${response.status})`)
  }

  const result = await response.json()
  const data = result?.data

  if (!data) return { status: 'pending' }

  const state = data.state

  if (state === 'success' || state === 'completed') {
    let resultJson: Record<string, unknown> = {}
    try {
      resultJson = JSON.parse(data.resultJson || '{}')
    } catch {
      // ignore parse errors
    }

    const resultUrls = resultJson?.resultUrls
    const imageUrl = Array.isArray(resultUrls) ? resultUrls[0] : undefined
    if (typeof imageUrl === 'string') {
      return { status: 'completed', imageUrl }
    }
    return { status: 'failed', error: 'No image URL in result' }
  }

  if (state === 'failed' || state === 'error') {
    return { status: 'failed', error: data.errorMessage || 'Task failed on server' }
  }

  return { status: 'processing' }
}
