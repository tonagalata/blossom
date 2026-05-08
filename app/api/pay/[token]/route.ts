import { NextRequest, NextResponse } from 'next/server'
import { getPaymentRequest, setPaymentIntentId } from '@/lib/db'
import { getStripeClient, getPublishableKey } from '@/lib/stripe'

type Params = { params: Promise<{ token: string }> }

export async function GET(_: NextRequest, { params }: Params) {
  const { token } = await params
  const req = await getPaymentRequest(token)

  if (!req) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (req.status !== 'pending') {
    return NextResponse.json({ error: req.status === 'paid' ? 'already_paid' : 'cancelled' }, { status: 410 })
  }

  let publishableKey: string
  try {
    publishableKey = await getPublishableKey()
  } catch {
    return NextResponse.json({ error: 'Payment not available' }, { status: 503 })
  }

  // Create or retrieve payment intent
  const stripe = await getStripeClient()
  let clientSecret: string

  if (req.stripe_payment_intent_id) {
    const pi = await stripe.paymentIntents.retrieve(req.stripe_payment_intent_id)
    clientSecret = pi.client_secret!
  } else {
    const pi = await stripe.paymentIntents.create({
      amount: req.amount,
      currency: req.currency,
      automatic_payment_methods: { enabled: true },
      description: req.description,
      receipt_email: req.client_email ?? undefined,
      metadata: { token, payment_request_id: req.id },
    })
    await setPaymentIntentId(token, pi.id)
    clientSecret = pi.client_secret!
  }

  return NextResponse.json({
    amount: req.amount,
    currency: req.currency,
    description: req.description,
    clientName: req.client_name,
    publishableKey,
    clientSecret,
  })
}
