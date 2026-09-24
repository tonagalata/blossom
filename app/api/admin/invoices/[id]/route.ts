import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import {
  getInvoice, updateInvoice, deleteInvoice, getCustomer, markInvoiceSent,
  linkInvoicePaymentRequest, recordManualInvoicePayment, createPaymentRequest,
} from '@/lib/db'
import type { LineItem } from '@/lib/types'
import { sendInvoiceEmail } from '@/lib/email'

type Params = { params: Promise<{ id: string }> }

export async function GET(_: NextRequest, { params }: Params) {
  const err = await requireAdmin()
  if (err) return err

  const { id } = await params
  const invoice = await getInvoice(id)
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const customer = await getCustomer(invoice.customer_id)
  return NextResponse.json({ invoice, customer })
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const err = await requireAdmin()
  if (err) return err

  const { id } = await params
  const body = await request.json()
  const { issueDate, dueDate, notes, terms, taxRate, lineItems, send, recordPaymentCents } = body as {
    issueDate?: string | null; dueDate?: string | null; notes?: string | null; terms?: string | null
    taxRate?: number; lineItems?: LineItem[]; send?: boolean; recordPaymentCents?: number
  }

  if (recordPaymentCents) {
    await recordManualInvoicePayment(id, recordPaymentCents)
    return NextResponse.json({ ok: true })
  }

  await updateInvoice(id, {
    issue_date: issueDate, due_date: dueDate, notes, terms, tax_rate: taxRate,
    line_items: lineItems?.map((li, i) => ({ ...li, id: li.id || randomUUID(), sort_order: i })),
  })

  if (send) {
    let invoice = await getInvoice(id)
    const customer = invoice ? await getCustomer(invoice.customer_id) : null
    if (invoice && customer && !invoice.payment_request_id) {
      const paymentRequestId = randomUUID()
      const paymentRequestToken = randomUUID().replace(/-/g, '')
      await createPaymentRequest({
        id: paymentRequestId,
        token: paymentRequestToken,
        amount: invoice.total - invoice.amount_paid,
        currency: invoice.currency,
        description: `Invoice ${invoice.invoice_number}`,
        client_name: [customer.first_name, customer.last_name].filter(Boolean).join(' ') || null,
        client_email: customer.email,
      })
      await linkInvoicePaymentRequest(id, paymentRequestId)
      invoice = await getInvoice(id)
    }
    await markInvoiceSent(id)
    if (invoice && customer) {
      const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
      await sendInvoiceEmail({
        to: customer.email,
        customerName: [customer.first_name, customer.last_name].filter(Boolean).join(' ') || customer.email,
        invoiceNumber: invoice.invoice_number,
        total: invoice.total,
        currency: invoice.currency,
        link: `${origin}/invoice/${invoice.token}`,
      })
    }
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const err = await requireAdmin()
  if (err) return err

  const { id } = await params
  await deleteInvoice(id)
  return NextResponse.json({ ok: true })
}
