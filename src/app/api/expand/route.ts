import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { expandPrompt } from '@/lib/ai/expand-prompt'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prompt, settings, model } = await request.json()

    if (!prompt || !settings || !model) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const jsonPrompt = await expandPrompt({ prompt, settings, modelId: model })

    return NextResponse.json({ jsonPrompt })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
