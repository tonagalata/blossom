import type { LineItem } from '@/lib/types'

// @react-pdf/renderer fetches Image `src` values server-side, so relative
// paths like "/uploads/x.jpg" (the storage layer's return format) need to
// be resolved to an absolute URL before rendering, unlike signature data
// URIs which are already self-contained.
export function resolveLineItemImageUrls<T extends { line_items: LineItem[] }>(doc: T, origin: string): T {
  return {
    ...doc,
    line_items: doc.line_items.map(item => (
      item.image_url && item.image_url.startsWith('/')
        ? { ...item, image_url: `${origin}${item.image_url}` }
        : item
    )),
  }
}
