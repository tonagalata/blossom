import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { getPortfolioItems, savePortfolioItems } from '@/lib/store'
import type { PortfolioItem } from '@/lib/types'
import { randomUUID } from 'crypto'

export async function GET() {
  const err = await requireAdmin()
  if (err) return err
  const items = await getPortfolioItems()
  return NextResponse.json(items)
}

export async function POST(request: NextRequest) {
  const err = await requireAdmin()
  if (err) return err

  try {
    const body = await request.json() as Omit<PortfolioItem, 'id' | 'order' | 'createdAt'>
    const items = await getPortfolioItems()

    const newItem: PortfolioItem = {
      ...body,
      id: randomUUID(),
      order: items.length,
      createdAt: new Date().toISOString(),
    }

    await savePortfolioItems([...items, newItem])
    return NextResponse.json(newItem, { status: 201 })
  } catch (e) {
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
    console.error('portfolio_post_failed', {
      id,
      message: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack : undefined,
    })
    return NextResponse.json({ error: 'Internal portfolio error', id }, { status: 500 })
  }
}

// Replace entire list (used for reordering)
export async function PUT(request: NextRequest) {
  const err = await requireAdmin()
  if (err) return err

  try {
    const items = await request.json() as PortfolioItem[]
    const reordered = items.map((item, i) => ({ ...item, order: i }))
    await savePortfolioItems(reordered)
    return NextResponse.json(reordered)
  } catch (e) {
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
    console.error('portfolio_put_failed', {
      id,
      message: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack : undefined,
    })
    return NextResponse.json({ error: 'Internal portfolio error', id }, { status: 500 })
  }
}
