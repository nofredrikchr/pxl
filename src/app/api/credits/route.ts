import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', user.id)
      .single()

    if (data) {
      return NextResponse.json({ balance: data.balance })
    }

    // First time user — grant 10 free credits
    const { data: newBalance } = await getSupabaseAdmin().rpc('add_credits', {
      p_user_id: user.id,
      p_amount: 10,
      p_type: 'free_grant',
      p_reference_id: 'welcome',
      p_description: 'Velkomstkreditter',
    })

    return NextResponse.json({ balance: newBalance ?? 10 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
