import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { requireAdmin } from '@/lib/requireAdmin'
import { getInvoice } from '@/lib/db'
import { InvoiceDocument } from '@/lib/pdf/InvoiceDocument'
import { resolveLineItemImageUrls } from '@/lib/pdf/resolveImageUrls'

export const runtime = 'nodejs'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  const err = await requireAdmin()
  if (err) return err

  const { id } = await params
  const invoice = await getInvoice(id)
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const buffer = await renderToBuffer(<InvoiceDocument invoice={resolveLineItemImageUrls(invoice, request.nextUrl.origin)} />)
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${invoice.invoice_number}.pdf"`,
    },
  })
}
