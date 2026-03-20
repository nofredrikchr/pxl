import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe/client'
import { getPackage } from '@/lib/stripe/config'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { packageId } = await request.json()
    const pkg = getPackage(packageId)
    if (!pkg) {
      return NextResponse.json({ error: 'Ugyldig pakke' }, { status: 400 })
    }

    const origin = request.headers.get('origin') || ''

    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: pkg.stripePriceId, quantity: 1 }],
      metadata: {
        user_id: user.id,
        credits_amount: String(pkg.credits),
      },
      success_url: `${origin}/priser?success=true`,
      cancel_url: `${origin}/priser?cancelled=true`,
    })

    // Record purchase attempt
    await supabase.from('stripe_purchases').insert({
      user_id: user.id,
      stripe_session_id: session.id,
      credits_amount: pkg.credits,
      amount_nok: pkg.priceNok * 100, // store in øre
      status: 'pending',
    })

    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
