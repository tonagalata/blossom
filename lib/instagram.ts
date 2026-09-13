export interface InstagramPost {
  id: string
  mediaUrl: string
  permalink: string
  caption: string | null
}

interface GraphMediaItem {
  id: string
  caption?: string
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  media_url: string
  thumbnail_url?: string
  permalink: string
}

const FIELDS = 'id,caption,media_type,media_url,thumbnail_url,permalink'

export async function getInstagramPosts(limit = 8): Promise<InstagramPost[]> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN
  if (!token) return []

  try {
    const url = `https://graph.instagram.com/me/media?fields=${FIELDS}&limit=${limit}&access_token=${token}`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) {
      console.error('instagram_fetch_failed', res.status, await res.text().catch(() => ''))
      return []
    }
    const data = await res.json() as { data?: GraphMediaItem[] }
    return (data.data ?? []).map(item => ({
      id: item.id,
      mediaUrl: item.media_type === 'VIDEO' ? (item.thumbnail_url ?? item.media_url) : item.media_url,
      permalink: item.permalink,
      caption: item.caption ?? null,
    }))
  } catch (e) {
    console.error('instagram_fetch_error', e instanceof Error ? e.message : String(e))
    return []
  }
}
