import { NextRequest, NextResponse } from 'next/server'
import { requireMember, isMemberPayload } from '@/lib/requireMember'
import { getMemberById } from '@/lib/db'
import { getStripeClient } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  const auth = await requireMember()
  if (!isMemberPayload(auth)) return auth

  const member = await getMemberById(auth.memberId)
  if (!member?.stripe_customer_id) {
    return NextResponse.json({ error: 'No Stripe customer found' }, { status: 404 })
  }

  const stripe = await getStripeClient()
  const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const session = await stripe.billingPortal.sessions.create({
    customer: member.stripe_customer_id,
    return_url: `${origin}/members`,
  })

  return NextResponse.json({ url: session.url })
}
