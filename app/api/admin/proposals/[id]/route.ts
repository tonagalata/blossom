import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { getProposal, updateProposal, deleteProposal, getCustomer, markProposalSent } from '@/lib/db'
import type { LineItem } from '@/lib/types'
import { sendProposalEmail } from '@/lib/email'

type Params = { params: Promise<{ id: string }> }

export async function GET(_: NextRequest, { params }: Params) {
  const err = await requireAdmin()
  if (err) return err

  const { id } = await params
  const proposal = await getProposal(id)
  if (!proposal) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const customer = await getCustomer(proposal.customer_id)
  return NextResponse.json({ proposal, customer })
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const err = await requireAdmin()
  if (err) return err

  const { id } = await params
  const body = await request.json()
  const { title, eventDate, validUntil, notes, terms, taxRate, depositPercentage, lineItems, send } = body as {
    title?: string; eventDate?: string | null; validUntil?: string | null
    notes?: string | null; terms?: string | null; taxRate?: number; depositPercentage?: number
    lineItems?: LineItem[]; send?: boolean
  }

  await updateProposal(id, {
    title, event_date: eventDate, valid_until: validUntil, notes, terms, tax_rate: taxRate,
    deposit_percentage: depositPercentage,
    line_items: lineItems?.map((li, i) => ({ ...li, id: li.id || crypto.randomUUID(), sort_order: i })),
  })

  if (send) {
    await markProposalSent(id)
    const proposal = await getProposal(id)
    const customer = proposal ? await getCustomer(proposal.customer_id) : null
    if (proposal && customer) {
      const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
      await sendProposalEmail({
        to: customer.email,
        customerName: [customer.first_name, customer.last_name].filter(Boolean).join(' ') || customer.email,
        title: proposal.title,
        total: proposal.total,
        currency: proposal.currency,
        link: `${origin}/proposal/${proposal.token}`,
      })
    }
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const err = await requireAdmin()
  if (err) return err

  const { id } = await params
  await deleteProposal(id)
  return NextResponse.json({ ok: true })
}
