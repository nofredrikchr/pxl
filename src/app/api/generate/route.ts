import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { expandPrompt } from '@/lib/ai/expand-prompt'
import { createKieTask } from '@/lib/kie/generate'
import { getCreditCost } from '@/lib/ai/models'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { prompt, settings, model, jsonOverride } = body

    if (!prompt || !settings || !model) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Deduct credits before generation
    const creditCost = getCreditCost(model)
    const { data: newBalance } = await supabase.rpc('deduct_credits', {
      p_user_id: user.id,
      p_amount: creditCost,
      p_reference_id: null,
    })

    if (newBalance === -1) {
      return NextResponse.json(
        { error: 'Ikke nok kreditter', code: 'INSUFFICIENT_CREDITS' },
        { status: 402 },
      )
    }

    // Step 1: Expand prompt (or use override)
    let jsonPrompt: object
    if (jsonOverride) {
      jsonPrompt = typeof jsonOverride === 'string' ? JSON.parse(jsonOverride) : jsonOverride
    } else {
      jsonPrompt = await expandPrompt({ prompt, settings, modelId: model })
    }

    // Step 2: Insert generation record
    const { data: generation, error: insertError } = await supabase
      .from('generations')
      .insert({
        user_id: user.id,
        prompt,
        json_prompt: jsonPrompt,
        settings,
        model_used: model,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError || !generation) {
      return NextResponse.json({ error: 'Failed to create generation record' }, { status: 500 })
    }

    // Step 3: Create Kie.ai task
    try {
      const { taskId } = await createKieTask({
        jsonPrompt,
        aspectRatio: settings.aspect_ratio,
        resolution: settings.resolution,
      })

      // Update with task ID
      await supabase
        .from('generations')
        .update({ kie_task_id: taskId, status: 'processing' })
        .eq('id', generation.id)

      return NextResponse.json({
        ...generation,
        kie_task_id: taskId,
        status: 'processing',
        json_prompt: jsonPrompt,
      })
    } catch (kieError: unknown) {
      const message = kieError instanceof Error ? kieError.message : 'Unknown Kie.ai error'
      await supabase
        .from('generations')
        .update({ status: 'failed', error_message: message })
        .eq('id', generation.id)

      return NextResponse.json({ error: message }, { status: 500 })
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
