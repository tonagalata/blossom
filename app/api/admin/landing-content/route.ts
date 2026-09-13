import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { getLandingContent, saveLandingContent } from '@/lib/store'
import { adminApiError } from '@/lib/apiError'
import type { LandingContent } from '@/lib/types'

export async function GET() {
  const err = await requireAdmin()
  if (err) return err
  return NextResponse.json(await getLandingContent())
}

export async function PUT(request: NextRequest) {
  const err = await requireAdmin()
  if (err) return err

  try {
    const content = await request.json() as LandingContent
    await saveLandingContent(content)
    return NextResponse.json(content)
  } catch (e) {
    return adminApiError('save landing content', e)
  }
}
