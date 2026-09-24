import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { requireAdmin } from '@/lib/requireAdmin'
import { getProposal } from '@/lib/db'
import { ProposalDocument } from '@/lib/pdf/ProposalDocument'
import { resolveLineItemImageUrls } from '@/lib/pdf/resolveImageUrls'

export const runtime = 'nodejs'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  const err = await requireAdmin()
  if (err) return err

  const { id } = await params
  const proposal = await getProposal(id)
  if (!proposal) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const buffer = await renderToBuffer(<ProposalDocument proposal={resolveLineItemImageUrls(proposal, request.nextUrl.origin)} />)
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="proposal-${id}.pdf"`,
    },
  })
}
