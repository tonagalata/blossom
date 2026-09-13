import { getPortfolioItems, getCategories } from '@/lib/store'
import PortfolioClient from './PortfolioClient'
import Footer from '@/components/Footer'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Portfolio — Events in Bloom' }

export default async function Portfolio() {
  const [items, categories] = await Promise.all([getPortfolioItems(), getCategories()])
  const sorted = [...items].sort((a, b) => a.order - b.order)
  return (
    <>
      <PortfolioClient items={sorted} categories={categories} />
      <Footer />
    </>
  )
}
