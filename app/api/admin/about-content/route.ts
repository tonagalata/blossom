import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { getAboutPageContent, saveAboutPageContent } from '@/lib/store'
import { adminApiError } from '@/lib/apiError'
import type { AboutPageContent } from '@/lib/types'

export async function GET() {
  const err = await requireAdmin()
  if (err) return err
  return NextResponse.json(await getAboutPageContent())
}

export async function PUT(request: NextRequest) {
  const err = await requireAdmin()
  if (err) return err

  try {
    const content = await request.json() as AboutPageContent
    await saveAboutPageContent(content)
    return NextResponse.json(content)
  } catch (e) {
    return adminApiError('save about content', e)
  }
}
