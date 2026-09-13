import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { getCategories, saveCategories } from '@/lib/store'
import type { PortfolioCategory } from '@/lib/types'

export async function GET() {
  const err = await requireAdmin()
  if (err) return err
  return NextResponse.json(await getCategories())
}

export async function PUT(request: NextRequest) {
  const err = await requireAdmin()
  if (err) return err

  const categories = await request.json() as PortfolioCategory[]
  await saveCategories(categories)
  return NextResponse.json(categories)
}
