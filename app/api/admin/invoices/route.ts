import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { listInvoices, createInvoice, nextInvoiceNumber } from '@/lib/db'
import type { LineItem, InvoiceStatus } from '@/lib/types'

export async function GET(request: NextRequest) {
  const err = await requireAdmin()
  if (err) return err

  const status = request.nextUrl.searchParams.get('status') as InvoiceStatus | null
  const customerId = request.nextUrl.searchParams.get('customerId')
  const invoices = await listInvoices({ status: status ?? undefined, customerId: customerId ?? undefined })
  return NextResponse.json({ invoices })
}

export async function POST(request: NextRequest) {
  const err = await requireAdmin()
  if (err) return err

  const body = await request.json()
  const { customerId, proposalId, issueDate, dueDate, notes, terms, taxRate, lineItems } = body as {
    customerId: string; proposalId?: string | null; issueDate?: string | null; dueDate?: string | null
    notes?: string | null; terms?: string | null; taxRate?: number; lineItems: LineItem[]
  }

  if (!customerId || !lineItems?.length) {
    return NextResponse.json({ error: 'Customer and at least one line item are required.' }, { status: 400 })
  }

  const id = randomUUID()
  const token = randomUUID().replace(/-/g, '')
  const invoiceNumber = await nextInvoiceNumber()
  await createInvoice({
    id, customer_id: customerId, proposal_id: proposalId || null, token, invoice_number: invoiceNumber,
    issue_date: issueDate || null, due_date: dueDate || null, notes: notes || null, terms: terms || null,
    tax_rate: taxRate ?? 0,
    line_items: lineItems.map((li, i) => ({ ...li, id: li.id || randomUUID(), sort_order: i })),
  })

  return NextResponse.json({ id, token, invoiceNumber })
}
