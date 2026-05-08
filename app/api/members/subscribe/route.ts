import { NextRequest, NextResponse } from 'next/server'
import { requireMember, isMemberPayload } from '@/lib/requireMember'
import { getMemberById, getPlan, updateMemberStripe, updatePlanStripe } from '@/lib/db'
import { getStripeClient } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  const auth = await requireMember()
  if (!isMemberPayload(auth)) return auth

  const { planId } = await request.json() as { planId: string }
  if (!planId) return NextResponse.json({ error: 'planId required' }, { status: 400 })

  const [member, plan] = await Promise.all([getMemberById(auth.memberId), getPlan(planId)])
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  if (!plan || !plan.stripe_price_id) return NextResponse.json({ error: 'Plan not available' }, { status: 404 })

  const stripe = await getStripeClient()
  const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  async function createCustomer() {
    const customer = await stripe.customers.create({
      email: member!.email,
      name: [member!.first_name, member!.last_name].filter(Boolean).join(' ') || undefined,
      metadata: { memberId: member!.id },
    })
    await updateMemberStripe(member!.id, { stripe_customer_id: customer.id })
    return customer.id
  }

  // Create or reuse Stripe customer — fall back to a new one if the stored ID
  // belongs to a different Stripe mode (e.g. live ID used with test key).
  let customerId = member.stripe_customer_id ?? await createCustomer()

  async function createSession(cid: string) {
    return stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: cid,
      line_items: [{ price: plan!.stripe_price_id!, quantity: 1 }],
      success_url: `${origin}/members?subscribed=1`,
      cancel_url: `${origin}/membership`,
      subscription_data: { metadata: { memberId: member!.id, planId } },
    })
  }

  let priceId = plan.stripe_price_id!

  async function recreatePrice() {
    const product = await stripe.products.create({ name: plan!.name, description: plan!.description ?? undefined })
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan!.amount,
      currency: plan!.currency,
      recurring: { interval: plan!.interval as 'month' | 'year' },
    })
    await updatePlanStripe(plan!.id, product.id, price.id)
    return price.id
  }

  let session
  try {
    session = await createSession(customerId)
  } catch (err: unknown) {
    const stripeErr = err as { code?: string; param?: string }
    if (stripeErr?.code === 'resource_missing' && stripeErr?.param === 'customer') {
      customerId = await createCustomer()
      session = await createSession(customerId)
    } else if (stripeErr?.code === 'resource_missing' && stripeErr?.param === 'line_items[0][price]') {
      // Price belongs to wrong Stripe mode — recreate in current mode and retry
      priceId = await recreatePrice()
      session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${origin}/members?subscribed=1`,
        cancel_url: `${origin}/membership`,
        subscription_data: { metadata: { memberId: member.id, planId } },
      })
    } else {
      throw err
    }
  }

  return NextResponse.json({ url: session.url })
}
