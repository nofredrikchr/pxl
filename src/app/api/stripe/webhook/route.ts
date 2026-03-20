import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/client'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const userId = session.metadata?.user_id
    const creditsAmount = Number(session.metadata?.credits_amount)

    if (!userId || !creditsAmount) {
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    // Idempotency check
    const { data: existing } = await getSupabaseAdmin()
      .from('stripe_purchases')
      .select('status')
      .eq('stripe_session_id', session.id)
      .single()

    if (existing?.status === 'completed') {
      return NextResponse.json({ received: true })
    }

    // Add credits
    await getSupabaseAdmin().rpc('add_credits', {
      p_user_id: userId,
      p_amount: creditsAmount,
      p_type: 'purchase',
      p_reference_id: session.id,
      p_description: `Kjøp: ${creditsAmount} kreditter`,
    })

    // Mark purchase as completed
    await getSupabaseAdmin()
      .from('stripe_purchases')
      .update({ status: 'completed' })
      .eq('stripe_session_id', session.id)
  }

  return NextResponse.json({ received: true })
}
