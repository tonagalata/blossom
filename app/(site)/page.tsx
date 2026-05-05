import Link from 'next/link'
import Footer from '@/components/Footer'
import { getSiteConfig } from '@/lib/store'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Events in Bloom — Florals for Every Occasion' }

export default async function Home() {
  const config = await getSiteConfig()

  return (
    <div className="page-body">

      <section className="hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="hero-img" src={config.heroImage} alt="Elegant floral arrangement" />
        <div className="hero-overlay">
          <p className="hero-eyebrow">Floral Arrangements &amp; Event Styling</p>
          <h1 className="hero-title">Florals for Everyday <br /><em>&amp;</em><br /> Special Moments</h1>
          <p className="hero-subtitle">
            Fresh seasonal florals, event styling, backdrop rentals, and in-home floral subscriptions — bringing beauty to every occasion and everyday moment.
          </p>
          <Link href="/portfolio" className="btn btn-light">View Portfolio</Link>
        </div>
        <div className="hero-scroll">
          <span>Scroll</span>
          <div className="hero-scroll-line" />
        </div>
      </section>

      <section className="about" id="about">
        <div className="about-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={config.aboutImage} alt="Floral arrangement" />
        </div>
        <div className="about-content">
          <p className="section-eyebrow">Our Story</p>
          <h2 className="section-title">Blooms that tell<br /><em>your</em> story</h2>
          <p className="section-body">
            Events in Bloom is a boutique floral studio rooted in the belief that flowers should be a part of everyday life —
            not just special occasions. We create fresh, seasonal arrangements for your home, style floral for private events,
            offer floral wall rentals for unforgettable moments, and deliver blooms straight to your door.
          </p>
          <p className="section-body">
            Every arrangement is composed with intention: unexpected color, seasonal texture, and a genuine love for the craft
            that shows in every stem.
          </p>
          <Link href="/inquiry" className="btn" style={{ marginTop: 8 }}>Start Planning</Link>
        </div>
      </section>

      <section className="services">
        <div className="services-header">
          <p className="section-eyebrow">What We Do</p>
          <h2 className="section-title">Our Services</h2>
          <div className="divider" />
        </div>
        <div className="services-grid">
          <div className="service-card">
            <span className="service-icon">✦</span>
            <h3 className="service-title">Floral Arrangements</h3>
            <p className="service-desc">
              Fresh, seasonal arrangements composed with intention — perfect for gifting, home décor,
              or any moment worth marking with flowers.
            </p>
          </div>
          <div className="service-card">
            <span className="service-icon">◈</span>
            <h3 className="service-title">Event Floral &amp; Styling</h3>
            <p className="service-desc">
              Full-service floral design for private events, birthdays, baby showers, and celebrations —
              from individual centerpieces to full tablescapes.
            </p>
          </div>
          <div className="service-card">
            <span className="service-icon">✿</span>
            <h3 className="service-title">In-Home Subscription</h3>
            <p className="service-desc">
              Keep your home in fresh bloom with recurring weekly or bi-weekly floral deliveries,
              curated to your aesthetic and the season.
            </p>
          </div>
          <div className="service-card">
            <span className="service-icon">◇</span>
            <h3 className="service-title">Floral Wall Rentals</h3>
            <p className="service-desc">
              Stunning floral and greenery backdrops available to rent — the perfect statement piece
              for your event, photo shoot, or brand activation.
            </p>
          </div>
        </div>
      </section>

      <section className="portfolio-preview">
        <div className="portfolio-preview-header">
          <p className="section-eyebrow">Recent Work</p>
          <h2 className="section-title">A Glimpse of <em>Our Work</em></h2>
          <div className="divider" />
        </div>
        <div className="preview-grid">
          {/* eslint-disable @next/next/no-img-element */}
          {config.previewImages.map((src, i) => (
            <div key={i} className="preview-item">
              <img src={src} alt="Portfolio preview" />
            </div>
          ))}
          {/* eslint-enable @next/next/no-img-element */}
        </div>
        <div className="preview-cta">
          <Link href="/portfolio" className="btn">View Full Portfolio</Link>
        </div>
      </section>

      <section className="cta-banner">
        <p className="section-eyebrow">Ready to Begin?</p>
        <h2 className="section-title">Let&apos;s <em>create something</em> beautiful</h2>
        <p className="section-body">
          Tell us about your vision and we&apos;ll design an experience that exceeds your every expectation.
        </p>
        <Link href="/inquiry" className="btn btn-gold">Send an Inquiry</Link>
      </section>

      <Footer />
    </div>
  )
}
