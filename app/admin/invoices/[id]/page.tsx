import { InvoiceBuilder } from '../InvoiceBuilder'

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <InvoiceBuilder id={id} />
}
