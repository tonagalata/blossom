import { randomUUID, createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getInvoiceByToken, addInvoiceSignature } from '@/lib/db'

type Params = { params: Promise<{ token: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  const { token } = await params
  const { signerName, signerEmail, signatureData } = await request.json()

  if (!signerName || !signerEmail || !signatureData) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  const invoice = await getInvoiceByToken(token)
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (invoice.signature) {
    return NextResponse.json({ error: 'This invoice has already been signed.' }, { status: 409 })
  }

  const documentHash = createHash('sha256')
    .update(JSON.stringify({ items: invoice.line_items, total: invoice.total }))
    .digest('hex')

  await addInvoiceSignature(invoice.id, {
    id: randomUUID(),
    signer_name: signerName,
    signer_email: signerEmail,
    signature_data: signatureData,
    signed_at: new Date().toISOString(),
    ip_address: request.headers.get('x-forwarded-for'),
    user_agent: request.headers.get('user-agent'),
    document_hash: documentHash,
  })

  return NextResponse.json({ ok: true })
}
