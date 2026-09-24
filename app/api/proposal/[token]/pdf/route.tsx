import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { getProposalByToken } from '@/lib/db'
import { ProposalDocument } from '@/lib/pdf/ProposalDocument'
import { resolveLineItemImageUrls } from '@/lib/pdf/resolveImageUrls'

export const runtime = 'nodejs'

type Params = { params: Promise<{ token: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  const { token } = await params
  const proposal = await getProposalByToken(token)
  if (!proposal) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const buffer = await renderToBuffer(<ProposalDocument proposal={resolveLineItemImageUrls(proposal, request.nextUrl.origin)} />)
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="proposal.pdf"`,
    },
  })
}
