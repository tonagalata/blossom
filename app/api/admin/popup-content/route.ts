import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { getPopupContent, savePopupContent } from '@/lib/store'
import { adminApiError } from '@/lib/apiError'
import type { PopupContent } from '@/lib/types'

export async function GET() {
  const err = await requireAdmin()
  if (err) return err
  return NextResponse.json(await getPopupContent())
}

export async function PUT(request: NextRequest) {
  const err = await requireAdmin()
  if (err) return err

  try {
    const content = await request.json() as PopupContent
    await savePopupContent(content)
    return NextResponse.json(content)
  } catch (e) {
    return adminApiError('save popup content', e)
  }
}
