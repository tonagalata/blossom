import Link from 'next/link'
import Footer from '@/components/Footer'
import { getAboutPageContent } from '@/lib/store'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'About Us — Events in Bloom' }

export default async function About() {
  const content = await getAboutPageContent()

  return (
    <div className="portfolio-page">
      <div className="page-header">
        <p className="section-eyebrow">{content.eyebrow}</p>
        <h1 className="section-title">{content.title}</h1>
      </div>

      <section className="about">
        <div className="about-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={content.image} alt="Floral arrangement" />
        </div>
        <div className="about-content">
          <p className="section-body">{content.body1}</p>
          <p className="section-body">{content.body2}</p>
          <Link href="/inquiry" className="btn" style={{ marginTop: 8 }}>{content.ctaLabel}</Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
