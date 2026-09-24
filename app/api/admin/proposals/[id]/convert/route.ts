import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { getProposal, createInvoice, nextInvoiceNumber, recordManualInvoicePayment } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export async function POST(_: NextRequest, { params }: Params) {
  const err = await requireAdmin()
  if (err) return err

  const { id } = await params
  const proposal = await getProposal(id)
  if (!proposal) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (proposal.status !== 'accepted') {
    return NextResponse.json({ error: 'Only accepted proposals can be converted to an invoice.' }, { status: 400 })
  }

  const invoiceId = randomUUID()
  const token = randomUUID().replace(/-/g, '')
  const invoiceNumber = await nextInvoiceNumber()
  await createInvoice({
    id: invoiceId,
    customer_id: proposal.customer_id,
    proposal_id: proposal.id,
    token,
    invoice_number: invoiceNumber,
    issue_date: new Date().toISOString().slice(0, 10),
    due_date: null,
    notes: proposal.notes,
    terms: proposal.terms,
    tax_rate: proposal.tax_rate,
    line_items: proposal.line_items,
  })

  if (proposal.deposit_percentage > 0 && proposal.deposit_status === 'paid') {
    const depositAmount = Math.round(proposal.total * proposal.deposit_percentage)
    await recordManualInvoicePayment(invoiceId, depositAmount)
  }

  return NextResponse.json({ id: invoiceId })
}
