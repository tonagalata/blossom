import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { getSiteConfig, saveSiteConfig } from '@/lib/store'
import type { SiteConfig } from '@/lib/types'

export async function GET() {
  const err = await requireAdmin()
  if (err) return err
  return NextResponse.json(await getSiteConfig())
}

export async function PUT(request: NextRequest) {
  const err = await requireAdmin()
  if (err) return err

  const config = await request.json() as SiteConfig
  config.updatedAt = new Date().toISOString()
  await saveSiteConfig(config)
  return NextResponse.json(config)
}
