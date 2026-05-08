import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { requireAdmin } from '@/lib/requireAdmin'
import { listPlans, createPlan } from '@/lib/db'
import { getStripeClient } from '@/lib/stripe'

export async function GET() {
  const err = await requireAdmin()
  if (err) return err

  const plans = await listPlans()
  return NextResponse.json({ plans })
}

export async function POST(request: NextRequest) {
  const err = await requireAdmin()
  if (err) return err

  const { name, description, amountDollars, interval, features, sortOrder } =
    await request.json() as {
      name: string
      description?: string
      amountDollars: number
      interval: 'month' | 'year'
      features?: string[]
      sortOrder?: number
    }

  if (!name || !amountDollars || !interval) {
    return NextResponse.json({ error: 'Name, amount, and interval are required.' }, { status: 400 })
  }

  const amount = Math.round(amountDollars * 100)
  let stripeProductId: string | null = null
  let stripePriceId: string | null = null

  try {
    const stripe = await getStripeClient()
    const product = await stripe.products.create({ name, description: description || undefined })
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: amount,
      currency: 'usd',
      recurring: { interval },
    })
    stripeProductId = product.id
    stripePriceId = price.id
  } catch {
    // Stripe not configured — plan saved without Stripe IDs (can sync later)
  }

  const id = randomUUID()
  await createPlan({
    id,
    stripe_product_id: stripeProductId,
    stripe_price_id: stripePriceId,
    name,
    description: description || null,
    amount,
    currency: 'usd',
    interval,
    features: features ?? [],
    sort_order: sortOrder ?? 0,
  })

  return NextResponse.json({ id })
}
