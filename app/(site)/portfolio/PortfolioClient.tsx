'use client'
import { useState } from 'react'
import Link from 'next/link'
import Footer from '@/components/Footer'
import type { PortfolioItem, Category } from '@/lib/types'

type FilterValue = 'all' | Category

const filters: { label: string; value: FilterValue }[] = [
  { label: 'All',                value: 'all'          },
  { label: 'Floral Arrangements',value: 'arrangements' },
  { label: 'Private Events',     value: 'events'       },
  { label: 'Backdrop Rentals',   value: 'rentals'      },
]

const CATEGORY_LABELS: Record<Category, string> = {
  arrangements: 'Floral Arrangements',
  events:       'Private Events',
  rentals:      'Backdrop Rentals',
}

export default function PortfolioClient({ items }: { items: PortfolioItem[] }) {
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all')
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null)

  const visible = (activeFilter === 'all'
    ? items
    : items.filter(i => i.category === activeFilter)
  ).filter(i => i.visible)

  function openLightbox(src: string, alt: string) {
    setLightbox({ src, alt })
    document.body.style.overflow = 'hidden'
  }

  function closeLightbox() {
    setLightbox(null)
    document.body.style.overflow = ''
  }

  return (
    <div className="portfolio-page">
      <div className="page-header">
        <p className="section-eyebrow">Our Work</p>
        <h1 className="section-title">Portfolio</h1>
        <p>A collection of our most cherished collaborations</p>
      </div>

      <div className="portfolio-filters">
        {filters.map(f => (
          <button
            key={f.value}
            className={`filter-btn${activeFilter === f.value ? ' active' : ''}`}
            onClick={() => setActiveFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="portfolio-grid">
        {visible.map(item => (
          <div
            key={item.id}
            className={`portfolio-item${item.wide ? ' wide' : ''}`}
            onClick={() => openLightbox(item.src, item.alt)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.src} alt={item.alt} />
            <div className="portfolio-item-overlay">
              <span className="portfolio-item-category">{CATEGORY_LABELS[item.category]}</span>
              <span className="portfolio-item-title">{item.title}</span>
            </div>
          </div>
        ))}
      </div>

      <section className="cta-banner" style={{ marginTop: 5 }}>
        <p className="section-eyebrow">Love What You See?</p>
        <h2 className="section-title">Let&apos;s bring your <em>vision</em> to life</h2>
        <p className="section-body">
          Every event is unique. Share your ideas and we&apos;ll create something made just for you.
        </p>
        <Link href="/inquiry" className="btn btn-gold">Get in Touch</Link>
      </section>

      <Footer />

      {lightbox && (
        <div
          className="lightbox open"
          onClick={e => { if (e.target === e.currentTarget) closeLightbox() }}
        >
          <div className="lightbox-inner">
            <button className="lightbox-close" onClick={closeLightbox}>✕ Close</button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightbox.src} alt={lightbox.alt} />
          </div>
        </div>
      )}
    </div>
  )
}
