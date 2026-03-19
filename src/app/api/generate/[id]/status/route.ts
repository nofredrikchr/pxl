import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { pollKieTask } from '@/lib/kie/poll'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const generationId = params.id

    // Get generation record
    const { data: generation, error } = await supabase
      .from('generations')
      .select('*')
      .eq('id', generationId)
      .eq('user_id', user.id)
      .single()

    if (error || !generation) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 })
    }

    // If already completed or failed, return current state
    if (generation.status === 'completed' || generation.status === 'failed') {
      return NextResponse.json(generation)
    }

    if (!generation.kie_task_id) {
      return NextResponse.json({ error: 'No task ID' }, { status: 400 })
    }

    // Poll Kie.ai
    const pollResult = await pollKieTask(generation.kie_task_id)

    if (pollResult.status === 'completed' && pollResult.imageUrl) {
      // Download image from Kie.ai
      const imageResponse = await fetch(pollResult.imageUrl)
      if (!imageResponse.ok) throw new Error('Failed to download image')
      const imageBuffer = await imageResponse.arrayBuffer()

      // Upload to Supabase Storage
      const filePath = `${user.id}/${generationId}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('generated-images')
        .upload(filePath, imageBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        })

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('generated-images')
        .getPublicUrl(filePath)

      // Update generation record
      await supabase
        .from('generations')
        .update({
          status: 'completed',
          image_url: urlData.publicUrl,
        })
        .eq('id', generationId)

      return NextResponse.json({
        ...generation,
        status: 'completed',
        image_url: urlData.publicUrl,
      })
    }

    if (pollResult.status === 'failed') {
      await supabase
        .from('generations')
        .update({
          status: 'failed',
          error_message: pollResult.error,
        })
        .eq('id', generationId)

      return NextResponse.json({
        ...generation,
        status: 'failed',
        error_message: pollResult.error,
      })
    }

    // Still processing
    return NextResponse.json({
      ...generation,
      status: 'processing',
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
