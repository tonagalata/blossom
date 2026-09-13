import Link from 'next/link'
import Footer from '@/components/Footer'
import HeroSlideshow from '@/components/HeroSlideshow'
import { getSiteConfig, getLandingContent } from '@/lib/store'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Events in Bloom — Florals for Every Occasion' }

export default async function Home() {
  const [config, content] = await Promise.all([getSiteConfig(), getLandingContent()])

  return (
    <div className="page-body">

      <section className="hero">
        <HeroSlideshow slides={config.heroSlides} durationSeconds={config.heroSlideDuration} />
        <div className="hero-scrim" />
        <fieldset className="hero-frame">
          <legend className="hero-script-title">Events in Bloom</legend>
          <p className="hero-eyebrow">{content.hero.subtitle}</p>
          <Link href="/inquiry" className="btn">{content.hero.buttonLabel}</Link>
        </fieldset>
      </section>

      <section className="about-summary" id="about">
        <div className="about-summary-inner">
          <p className="section-eyebrow">{content.about.eyebrow}</p>
          <h2 className="section-title">{content.about.title}</h2>
          <p className="section-body">{content.about.body}</p>
          <Link href="/inquiry" className="btn">{content.about.ctaLabel}</Link>
        </div>
      </section>

      <section className="services" id="services">
        <div className="services-header">
          <h2 className="section-title">{content.services.heading}</h2>
        </div>
        <div className="services-grid">
          {content.services.items.map((item, i) => (
            <div className="service-card" key={i}>
              <h3 className="service-title">{item.title}</h3>
              <p className="service-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="portfolio-preview">
        <div className="portfolio-preview-header">
          <h2 className="section-title">{content.gallery.heading}</h2>
        </div>
        {/* eslint-disable @next/next/no-img-element */}
        <div className="preview-grid">
          <div className="preview-item">
            <img src={config.previewImages[1]} alt="Portfolio preview" />
          </div>
          <div className="preview-item">
            <img src={config.previewImages[0]} alt="Portfolio preview" />
          </div>
        </div>
        {/* eslint-enable @next/next/no-img-element */}
      </section>

      <section className="testimonial-band">
        <p className="testimonial-quote">&ldquo;{content.testimonial.quote}&rdquo;</p>
        <p className="testimonial-attribution">{content.testimonial.attribution}</p>
      </section>

      <section className="testimonials-grid">
        <div className="testimonials-grid-inner">
          {content.testimonials.map((t, i) => (
            <div className="testimonial-card" key={i}>
              <p className="testimonial-quote">&ldquo;{t.quote}&rdquo;</p>
              <p className="testimonial-attribution">{t.attribution}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-banner">
        <h2 className="section-title">{content.cta.heading}</h2>
        <Link href="/inquiry" className="btn btn-solid">{content.cta.buttonLabel}</Link>
      </section>

      <Footer />
    </div>
  )
}
