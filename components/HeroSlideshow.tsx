'use client'
import { useEffect, useState } from 'react'
import type { HeroSlide } from '@/lib/types'

export default function HeroSlideshow({ slides, durationSeconds = 6 }: { slides: HeroSlide[]; durationSeconds?: number }) {
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (slides.length <= 1) return
    const t = setInterval(() => {
      setActive(i => (i + 1) % slides.length)
    }, Math.max(1, durationSeconds) * 1000)
    return () => clearInterval(t)
  }, [slides.length, durationSeconds])

  if (slides.length === 0) return null

  return (
    <div className="hero-bg">
      {slides.map((slide, i) => (
        <div key={i} className={`hero-slide${i === active ? ' active' : ''}`}>
          {slide.type === 'video' ? (
            <video src={slide.src} autoPlay muted loop playsInline />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={slide.src} alt="Elegant floral arrangement" />
          )}
        </div>
      ))}
    </div>
  )
}
