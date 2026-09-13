import { promises as fs } from 'fs'
import path from 'path'
import type { PortfolioItem, SiteConfig, PortfolioCategory, LandingContent, PopupContent, AboutPageContent } from './types'

// `NETLIFY=true` is documented to be set during both build AND runtime on
// Netlify, but in production this Next.js app's Route Handlers run inside the
// Netlify Next.js Runtime's own Lambda wrapper, which does not reliably
// propagate that var — confirmed in production by a save attempt falling
// through to `localWrite` and failing with ENOENT on the read-only
// `/var/task` Lambda bundle path. AWS_LAMBDA_FUNCTION_NAME / LAMBDA_TASK_ROOT
// are standard Lambda-injected vars that are never present on a local dev or
// build machine, so they're a more reliable "are we actually running in the
// deployed serverless environment" signal than NETLIFY alone.
// Blobs only work at runtime (not during the build phase), so every blob
// helper wraps its entire body in try/catch and returns a safe default on
// failure — this lets the build succeed and real data is served at runtime.
const IS_NETLIFY = Boolean(
  process.env.NETLIFY === 'true' ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT
)
const DATA_DIR = path.join(process.cwd(), 'data')
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads')

// ─── Netlify Blobs helpers ───────────────────────────────────────────────────

async function blobGet<T>(storeName: string, key: string): Promise<T | null> {
  try {
    const { getStore } = await import('@netlify/blobs')
    const store = getStore(storeName)
    return await store.get(key, { type: 'json' }) as T
  } catch {
    return null
  }
}

async function blobSet(storeName: string, key: string, value: unknown): Promise<void> {
  const { getStore } = await import('@netlify/blobs')
  const store = getStore(storeName)
  await store.set(key, JSON.stringify(value))
}

async function blobSetRaw(storeName: string, key: string, data: Buffer, contentType: string): Promise<void> {
  const { getStore } = await import('@netlify/blobs')
  const store = getStore(storeName)
  // Node.js Buffers can be views into a larger ArrayBuffer; slice to exact bytes.
  const arrayBuffer: ArrayBuffer = data.buffer.slice(
    data.byteOffset,
    data.byteOffset + data.byteLength
  ) as ArrayBuffer
  await store.set(key, arrayBuffer, { metadata: { contentType } })
}

async function blobGetRaw(storeName: string, key: string): Promise<{ data: Buffer; contentType: string } | null> {
  try {
    const { getStore } = await import('@netlify/blobs')
    const store = getStore(storeName)
    const result = await store.getWithMetadata(key, { type: 'blob' })
    if (!result) return null
    const { data, metadata } = result as { data: Blob; metadata: Record<string, unknown> }
    const buf = Buffer.from(await data.arrayBuffer())
    return { data: buf, contentType: (metadata?.contentType as string) || 'image/jpeg' }
  } catch {
    return null
  }
}

async function blobList(storeName: string): Promise<string[]> {
  try {
    const { getStore } = await import('@netlify/blobs')
    const store = getStore(storeName)
    const { blobs } = await store.list()
    return blobs.map(b => b.key)
  } catch {
    return []
  }
}

async function blobDelete(storeName: string, key: string): Promise<void> {
  const { getStore } = await import('@netlify/blobs')
  const store = getStore(storeName)
  await store.delete(key)
}

// ─── Local file helpers ──────────────────────────────────────────────────────

async function localRead<T>(filename: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, filename), 'utf-8')
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

async function localWrite(filename: string, data: unknown): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2))
}

// ─── Portfolio ───────────────────────────────────────────────────────────────

import { listPortfolioItems, savePortfolioItems as dbSavePortfolioItems } from './db'

export async function getPortfolioItems(): Promise<PortfolioItem[]> {
  return listPortfolioItems()
}

export async function savePortfolioItems(items: PortfolioItem[]): Promise<void> {
  await dbSavePortfolioItems(items)
}

// ─── Site config ─────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: SiteConfig = {
  previewImages: [
    '/images/arrangements.PNG',
    '/images/private_event.PNG',
    '/images/arrangements2.PNG',
    '/images/private_event8.PNG',
  ],
  heroSlides: [
    { type: 'image', src: '/images/arrangements7.PNG' },
  ],
  heroSlideDuration: 6,
  updatedAt: new Date().toISOString(),
}

export async function getSiteConfig(): Promise<SiteConfig> {
  if (IS_NETLIFY) {
    const saved = await blobGet<SiteConfig>('site-config', 'config')
    return saved ? { ...DEFAULT_CONFIG, ...saved } : DEFAULT_CONFIG
  }
  const saved = await localRead<SiteConfig | null>('site-config.json', null)
  return saved ? { ...DEFAULT_CONFIG, ...saved } : DEFAULT_CONFIG
}

export async function saveSiteConfig(config: SiteConfig): Promise<void> {
  if (IS_NETLIFY) {
    await blobSet('site-config', 'config', config)
  } else {
    await localWrite('site-config.json', config)
  }
}

// ─── Portfolio categories ─────────────────────────────────────────────────────

const DEFAULT_CATEGORIES: PortfolioCategory[] = [
  { value: 'arrangements', label: 'Floral Arrangements' },
  { value: 'events', label: 'Private Events' },
  { value: 'rentals', label: 'Backdrop Rentals' },
]

export async function getCategories(): Promise<PortfolioCategory[]> {
  if (IS_NETLIFY) {
    return (await blobGet<PortfolioCategory[]>('categories', 'list')) ?? DEFAULT_CATEGORIES
  }
  return localRead<PortfolioCategory[]>('categories.json', DEFAULT_CATEGORIES)
}

export async function saveCategories(categories: PortfolioCategory[]): Promise<void> {
  if (IS_NETLIFY) {
    await blobSet('categories', 'list', categories)
  } else {
    await localWrite('categories.json', categories)
  }
}

// ─── Landing page content ─────────────────────────────────────────────────────

const DEFAULT_LANDING_CONTENT: LandingContent = {
  hero: {
    subtitle: 'Floral & Event Styling · Bethesda & the DMV',
    buttonLabel: 'Request a Quote',
  },
  about: {
    eyebrow: 'Our Story',
    title: 'Blooms that tell your story',
    body: 'Every arrangement is composed with intention: unexpected color, seasonal texture, and a genuine love for the craft that shows in every stem.',
    ctaLabel: 'Start Planning',
  },
  services: {
    heading: 'Thoughtfully styled, just for you.',
    items: [
      { title: 'Wedding Florals', desc: 'From intimate gatherings to grand celebrations, we create florals that tell your love story.' },
      { title: 'Celebrations & Tablescapes', desc: "Elevated floral design for life's special moments — showers, birthdays, dinners and more." },
      { title: 'Bouquets', desc: 'Hand-tied blooms for every occasion, designed with beauty, intention and care.' },
    ],
  },
  gallery: {
    heading: 'A glimpse of our work',
  },
  testimonial: {
    quote: 'The floral arrangements were fresh, elegant, and brought the whole space to life.',
    attribution: 'Leah L. · Thumbtack',
  },
  testimonials: [
    { quote: 'Every detail was handled with such care. Our wedding florals were beyond what we imagined.', attribution: 'Sarah M. · Google' },
    { quote: 'The table arrangements for our dinner party were stunning. Guests could not stop complimenting them.', attribution: 'Diana K. · Yelp' },
    { quote: 'My bridal bouquet was absolutely perfect — exactly the romantic, lush look I had always envisioned.', attribution: 'Priya R. · Thumbtack' },
  ],
  cta: {
    heading: "Let's bring your celebration to life.",
    buttonLabel: 'Tell Us About Your Event',
  },
}

export async function getLandingContent(): Promise<LandingContent> {
  if (IS_NETLIFY) {
    const saved = await blobGet<LandingContent>('landing-content', 'content')
    return saved ? { ...DEFAULT_LANDING_CONTENT, ...saved } : DEFAULT_LANDING_CONTENT
  }
  const saved = await localRead<LandingContent | null>('landing-content.json', null)
  return saved ? { ...DEFAULT_LANDING_CONTENT, ...saved } : DEFAULT_LANDING_CONTENT
}

export async function saveLandingContent(content: LandingContent): Promise<void> {
  if (IS_NETLIFY) {
    await blobSet('landing-content', 'content', content)
  } else {
    await localWrite('landing-content.json', content)
  }
}

// ─── Popup content ────────────────────────────────────────────────────────────

const DEFAULT_POPUP_CONTENT: PopupContent = {
  eyebrow: "let's work together",
  title: 'What brings you here?',
  body: "Whether you're planning an event, ordering florals, or exploring a membership, we'd love to help.",
  image: '/images/arrangements5.PNG',
  options: [
    { value: 'Event Inquiry', label: 'Book an Event' },
    { value: 'Floral Order', label: 'Place a Floral Order' },
    { value: 'Membership Interest', label: 'Learn About Membership' },
  ],
}

export async function getPopupContent(): Promise<PopupContent> {
  if (IS_NETLIFY) {
    return (await blobGet<PopupContent>('popup-content', 'content')) ?? DEFAULT_POPUP_CONTENT
  }
  return localRead<PopupContent>('popup-content.json', DEFAULT_POPUP_CONTENT)
}

export async function savePopupContent(content: PopupContent): Promise<void> {
  if (IS_NETLIFY) {
    await blobSet('popup-content', 'content', content)
  } else {
    await localWrite('popup-content.json', content)
  }
}

// ─── About page content ───────────────────────────────────────────────────────

const DEFAULT_ABOUT_CONTENT: AboutPageContent = {
  eyebrow: 'About Us',
  title: 'About Events in Bloom Co.',
  body1: 'Events in Bloom Co. creates elegant custom florals for birthdays, graduations, bridal showers, baby showers, private afternoon teas, dinner parties, intimate weddings, and special celebrations across Bethesda and the DMV.',
  body2: 'We specialize in custom centerpieces, bouquets, table florals, and thoughtful event styling designed around your vision, color palette, and budget. From intimate afternoon tea gatherings to full celebration setups, we create polished designs that feel personal, beautiful, and memorable.',
  image: '/images/arrangements2.PNG',
  ctaLabel: 'Start Planning',
}

export async function getAboutPageContent(): Promise<AboutPageContent> {
  if (IS_NETLIFY) {
    const saved = await blobGet<AboutPageContent>('about-content', 'content')
    return saved ? { ...DEFAULT_ABOUT_CONTENT, ...saved } : DEFAULT_ABOUT_CONTENT
  }
  const saved = await localRead<AboutPageContent | null>('about-content.json', null)
  return saved ? { ...DEFAULT_ABOUT_CONTENT, ...saved } : DEFAULT_ABOUT_CONTENT
}

export async function saveAboutPageContent(content: AboutPageContent): Promise<void> {
  if (IS_NETLIFY) {
    await blobSet('about-content', 'content', content)
  } else {
    await localWrite('about-content.json', content)
  }
}

// ─── Image uploads ───────────────────────────────────────────────────────────

export async function saveUploadedImage(
  filename: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  if (IS_NETLIFY) {
    await blobSetRaw('uploads', filename, buffer, contentType)
    return `/api/uploads/${filename}`
  } else {
    await fs.mkdir(UPLOADS_DIR, { recursive: true })
    await fs.writeFile(path.join(UPLOADS_DIR, filename), buffer)
    return `/uploads/${filename}`
  }
}

export async function getUploadedImage(filename: string): Promise<{ data: Buffer; contentType: string } | null> {
  if (IS_NETLIFY) {
    return blobGetRaw('uploads', filename)
  } else {
    try {
      const data = await fs.readFile(path.join(UPLOADS_DIR, filename))
      const ext = path.extname(filename).toLowerCase()
      const contentType = ext === '.png' ? 'image/png' : ext === '.gif' ? 'image/gif' : ext === '.webp' ? 'image/webp' : 'image/jpeg'
      return { data, contentType }
    } catch {
      return null
    }
  }
}

export async function listUploadedImages(): Promise<string[]> {
  if (IS_NETLIFY) {
    const keys = await blobList('uploads')
    return keys.map(k => `/api/uploads/${k}`)
  } else {
    try {
      const files = await fs.readdir(UPLOADS_DIR)
      return files
        .filter(f => !f.startsWith('.') && /\.(png|jpe?g|gif|webp)$/i.test(f))
        .map(f => `/uploads/${f}`)
    } catch {
      return []
    }
  }
}

export async function deleteUploadedImage(filename: string): Promise<void> {
  if (IS_NETLIFY) {
    await blobDelete('uploads', filename)
  } else {
    try {
      await fs.unlink(path.join(UPLOADS_DIR, filename))
    } catch {
      // already gone
    }
  }
}

// ─── Stripe config ───────────────────────────────────────────────────────────

import type { StripeConfig } from './types'

export async function getStripeConfig(): Promise<StripeConfig | null> {
  if (IS_NETLIFY) {
    return blobGet<StripeConfig>('stripe', 'config')
  }
  return localRead<StripeConfig | null>('stripe-config.json', null)
}

export async function saveStripeConfig(config: StripeConfig): Promise<void> {
  if (IS_NETLIFY) {
    await blobSet('stripe', 'config', config)
  } else {
    await localWrite('stripe-config.json', config)
  }
}

// ─── Built-in image list (from public/images/) ───────────────────────────────

export async function listBuiltinImages(): Promise<string[]> {
  const dir = path.join(process.cwd(), 'public', 'images')
  try {
    const files = await fs.readdir(dir)
    return files
      .filter(f => /\.(png|jpe?g|gif|webp)$/i.test(f))
      .map(f => `/images/${f}`)
  } catch {
    return []
  }
}

// ─── Built-in video list (from public/videos/) ────────────────────────────────

export async function listBuiltinVideos(): Promise<string[]> {
  const dir = path.join(process.cwd(), 'public', 'videos')
  try {
    const files = await fs.readdir(dir)
    return files
      .filter(f => /\.(mp4|mov|webm|ogg)$/i.test(f))
      .map(f => `/videos/${f}`)
  } catch {
    return []
  }
}
