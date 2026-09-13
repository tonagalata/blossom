import Nav from '@/components/Nav'
import IntentModal from '@/components/IntentModal'
import { getPopupContent } from '@/lib/store'

export const dynamic = 'force-dynamic'

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const popupContent = await getPopupContent()

  return (
    <>
      <Nav />
      {children}
      <IntentModal content={popupContent} />
    </>
  )
}
