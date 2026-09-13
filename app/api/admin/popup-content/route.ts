import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { getPopupContent, savePopupContent } from '@/lib/store'
import type { PopupContent } from '@/lib/types'

export async function GET() {
  const err = await requireAdmin()
  if (err) return err
  return NextResponse.json(await getPopupContent())
}

export async function PUT(request: NextRequest) {
  const err = await requireAdmin()
  if (err) return err

  const content = await request.json() as PopupContent
  await savePopupContent(content)
  return NextResponse.json(content)
}
