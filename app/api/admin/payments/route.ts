import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { requireAdmin } from '@/lib/requireAdmin'
import { listPaymentRequests, createPaymentRequest } from '@/lib/db'

export async function GET() {
  const err = await requireAdmin()
  if (err) return err

  const payments = await listPaymentRequests()
  return NextResponse.json({ payments })
}

export async function POST(request: NextRequest) {
  const err = await requireAdmin()
  if (err) return err

  const { description, amountDollars, clientName, clientEmail, currency = 'usd' } =
    await request.json() as {
      description: string
      amountDollars: number
      clientName?: string
      clientEmail?: string
      currency?: string
    }

  if (!description || !amountDollars || amountDollars <= 0) {
    return NextResponse.json({ error: 'Description and amount are required.' }, { status: 400 })
  }

  const id = randomUUID()
  const token = randomUUID().replace(/-/g, '')

  await createPaymentRequest({
    id,
    token,
    amount: Math.round(amountDollars * 100),
    currency,
    description,
    client_name: clientName || null,
    client_email: clientEmail || null,
  })

  return NextResponse.json({ id, token })
}
