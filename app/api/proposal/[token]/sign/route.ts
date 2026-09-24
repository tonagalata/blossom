import { randomUUID, createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getProposalByToken, getCustomer, addProposalSignature, createPaymentRequest, linkProposalPaymentRequest } from '@/lib/db'
import { sendProposalAcceptedEmail, sendProposalDeclinedEmail } from '@/lib/email'

type Params = { params: Promise<{ token: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  const { token } = await params
  const { signerName, signerEmail, signatureData, decision } = await request.json()

  if (!signerName || !signerEmail || (decision !== 'accepted' && decision !== 'declined')) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }
  if (decision === 'accepted' && !signatureData) {
    return NextResponse.json({ error: 'A signature is required to accept.' }, { status: 400 })
  }

  const proposal = await getProposalByToken(token)
  if (!proposal) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (proposal.status === 'accepted' || proposal.status === 'declined') {
    return NextResponse.json({ error: 'This proposal has already been responded to.' }, { status: 409 })
  }

  const documentHash = createHash('sha256')
    .update(JSON.stringify({ items: proposal.line_items, total: proposal.total }))
    .digest('hex')

  await addProposalSignature(proposal.id, {
    id: randomUUID(),
    signer_name: signerName,
    signer_email: signerEmail,
    signature_data: signatureData ?? '',
    signed_at: new Date().toISOString(),
    ip_address: request.headers.get('x-forwarded-for'),
    user_agent: request.headers.get('user-agent'),
    document_hash: documentHash,
  }, decision)

  const customer = await getCustomer(proposal.customer_id)
  const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const customerName = customer ? [customer.first_name, customer.last_name].filter(Boolean).join(' ') || customer.email : signerName
  const adminLink = `${origin}/admin/proposals/${proposal.id}`

  if (decision === 'accepted') {
    if (proposal.deposit_percentage > 0 && !proposal.payment_request_id) {
      const paymentRequestId = randomUUID()
      const paymentRequestToken = randomUUID().replace(/-/g, '')
      await createPaymentRequest({
        id: paymentRequestId,
        token: paymentRequestToken,
        amount: Math.round(proposal.total * proposal.deposit_percentage),
        currency: proposal.currency,
        description: `Deposit (${Math.round(proposal.deposit_percentage * 100)}%) for ${proposal.title}`,
        client_name: customer ? [customer.first_name, customer.last_name].filter(Boolean).join(' ') || null : signerName,
        client_email: customer?.email ?? signerEmail,
      })
      await linkProposalPaymentRequest(proposal.id, paymentRequestId)
    }
    await sendProposalAcceptedEmail({ customerName, title: proposal.title, adminLink }).catch(() => {})
  } else {
    await sendProposalDeclinedEmail({ customerName, title: proposal.title, adminLink }).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
