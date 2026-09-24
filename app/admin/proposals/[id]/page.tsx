import { ProposalBuilder } from '../ProposalBuilder'

export default async function ProposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ProposalBuilder id={id} />
}
