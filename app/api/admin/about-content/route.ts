import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { getAboutPageContent, saveAboutPageContent } from '@/lib/store'
import type { AboutPageContent } from '@/lib/types'

export async function GET() {
  const err = await requireAdmin()
  if (err) return err
  return NextResponse.json(await getAboutPageContent())
}

export async function PUT(request: NextRequest) {
  const err = await requireAdmin()
  if (err) return err

  const content = await request.json() as AboutPageContent
  await saveAboutPageContent(content)
  return NextResponse.json(content)
}
