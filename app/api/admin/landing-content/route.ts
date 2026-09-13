import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { getLandingContent, saveLandingContent } from '@/lib/store'
import type { LandingContent } from '@/lib/types'

export async function GET() {
  const err = await requireAdmin()
  if (err) return err
  return NextResponse.json(await getLandingContent())
}

export async function PUT(request: NextRequest) {
  const err = await requireAdmin()
  if (err) return err

  const content = await request.json() as LandingContent
  await saveLandingContent(content)
  return NextResponse.json(content)
}
