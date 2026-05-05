import { promises as fs } from 'fs'
import path from 'path'
import type { PortfolioItem, SiteConfig } from './types'

// NETLIFY=true is set during both build AND runtime on Netlify.
// Blobs only work at runtime (not during the build phase), so every blob
// helper wraps its entire body in try/catch and returns a safe default on
// failure — this lets the build succeed and real data is served at runtime.
const IS_NETLIFY = process.env.NETLIFY === 'true'
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
  await store.set(key, data.buffer as ArrayBuffer, { metadata: { contentType } })
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

export async function getPortfolioItems(): Promise<PortfolioItem[]> {
  if (IS_NETLIFY) {
    return (await blobGet<PortfolioItem[]>('portfolio', 'items')) ?? []
  }
  return localRead<PortfolioItem[]>('portfolio.json', [])
}

export async function savePortfolioItems(items: PortfolioItem[]): Promise<void> {
  if (IS_NETLIFY) {
    await blobSet('portfolio', 'items', items)
  } else {
    await localWrite('portfolio.json', items)
  }
}

// ─── Site config ─────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: SiteConfig = {
  heroImage: '/images/arrangements7.PNG',
  aboutImage: '/images/arrangements2.PNG',
  previewImages: [
    '/images/arrangements.PNG',
    '/images/private_event.PNG',
    '/images/arrangements2.PNG',
    '/images/private_event8.PNG',
  ],
  updatedAt: new Date().toISOString(),
}

export async function getSiteConfig(): Promise<SiteConfig> {
  if (IS_NETLIFY) {
    return (await blobGet<SiteConfig>('site-config', 'config')) ?? DEFAULT_CONFIG
  }
  return localRead<SiteConfig>('site-config.json', DEFAULT_CONFIG)
}

export async function saveSiteConfig(config: SiteConfig): Promise<void> {
  if (IS_NETLIFY) {
    await blobSet('site-config', 'config', config)
  } else {
    await localWrite('site-config.json', config)
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
