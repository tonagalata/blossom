import { getPortfolioItems } from '@/lib/store'
import PortfolioClient from './PortfolioClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Portfolio — Events in Bloom' }

export default async function Portfolio() {
  const items = await getPortfolioItems()
  const sorted = [...items].sort((a, b) => a.order - b.order)
  return <PortfolioClient items={sorted} />
}
