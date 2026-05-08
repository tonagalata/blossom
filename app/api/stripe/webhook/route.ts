import { NextRequest, NextResponse } from 'next/server'
import { getStripeClient, getWebhookSecret } from '@/lib/stripe'
import { markPaymentPaid, getMemberByCustomerId, updateMemberStripe } from '@/lib/db'
import type Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  const webhookSecret = await getWebhookSecret()
  if (!webhookSecret || !sig) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 400 })
  }

  const stripe = await getStripeClient()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent
      await markPaymentPaid(pi.id)
      break
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const member = await getMemberByCustomerId(sub.customer as string)
      if (member) {
        await updateMemberStripe(member.id, {
          subscription_id: sub.id,
          subscription_status: sub.status as Member['subscription_status'],
          plan_id: sub.metadata?.planId ?? member.plan_id ?? undefined,
          current_period_end: new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000).toISOString(),
        })
      }
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const member = await getMemberByCustomerId(sub.customer as string)
      if (member) {
        await updateMemberStripe(member.id, { subscription_status: 'canceled' })
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}

// needed to avoid TS error for Member type without import
type Member = { subscription_status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | null }
