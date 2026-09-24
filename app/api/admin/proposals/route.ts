import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { listProposals, createProposal, getCustomer, markProposalSent, getProposal } from '@/lib/db'
import type { LineItem, ProposalStatus } from '@/lib/types'
import { sendProposalEmail } from '@/lib/email'

export async function GET(request: NextRequest) {
  const err = await requireAdmin()
  if (err) return err

  const status = request.nextUrl.searchParams.get('status') as ProposalStatus | null
  const customerId = request.nextUrl.searchParams.get('customerId')
  const proposals = await listProposals({ status: status ?? undefined, customerId: customerId ?? undefined })
  return NextResponse.json({ proposals })
}

export async function POST(request: NextRequest) {
  const err = await requireAdmin()
  if (err) return err

  const body = await request.json()
  const { customerId, title, eventDate, validUntil, notes, terms, taxRate, depositPercentage, lineItems, send } = body as {
    customerId: string; title: string; eventDate?: string | null; validUntil?: string | null
    notes?: string | null; terms?: string | null; taxRate?: number; depositPercentage?: number
    lineItems: LineItem[]; send?: boolean
  }

  if (!customerId || !title || !lineItems?.length) {
    return NextResponse.json({ error: 'Customer, title and at least one line item are required.' }, { status: 400 })
  }

  const id = randomUUID()
  const token = randomUUID().replace(/-/g, '')
  await createProposal({
    id, customer_id: customerId, token, title,
    event_date: eventDate || null, valid_until: validUntil || null,
    notes: notes || null, terms: terms || null, tax_rate: taxRate ?? 0,
    deposit_percentage: depositPercentage ?? 0,
    line_items: lineItems.map((li, i) => ({ ...li, id: li.id || randomUUID(), sort_order: i })),
  })

  if (send) {
    await markProposalSent(id)
    const [customer, proposal] = await Promise.all([getCustomer(customerId), getProposal(id)])
    if (customer && proposal) {
      const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
      await sendProposalEmail({
        to: customer.email,
        customerName: [customer.first_name, customer.last_name].filter(Boolean).join(' ') || customer.email,
        title: proposal.title,
        total: proposal.total,
        currency: proposal.currency,
        link: `${origin}/proposal/${token}`,
      })
    }
  }

  return NextResponse.json({ id, token })
}
