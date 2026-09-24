import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { getInvoiceByToken } from '@/lib/db'
import { InvoiceDocument } from '@/lib/pdf/InvoiceDocument'
import { resolveLineItemImageUrls } from '@/lib/pdf/resolveImageUrls'

export const runtime = 'nodejs'

type Params = { params: Promise<{ token: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  const { token } = await params
  const invoice = await getInvoiceByToken(token)
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const buffer = await renderToBuffer(<InvoiceDocument invoice={resolveLineItemImageUrls(invoice, request.nextUrl.origin)} />)
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${invoice.invoice_number}.pdf"`,
    },
  })
}
