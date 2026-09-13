import type { Metadata } from 'next'
import { Libre_Baskerville, Great_Vibes } from 'next/font/google'
import './globals.css'

const libreBaskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
})

const greatVibes = Great_Vibes({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-script',
})

export const metadata: Metadata = {
  title: 'Events in Bloom — Floral Arrangements & Event Styling',
  description: 'Events in Bloom offers floral arrangements, event floral and styling, backdrop rentals, and in-home floral subscriptions.',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon_io/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon_io/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/favicon_io/apple-touch-icon.png',
  },
  manifest: '/favicon_io/site.webmanifest',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${libreBaskerville.variable} ${greatVibes.variable}`}>
      <body>
        {children}
      </body>
    </html>
  )
}
