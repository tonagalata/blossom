import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { getPortfolioItems, savePortfolioItems } from '@/lib/store'
import type { PortfolioItem } from '@/lib/types'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const err = await requireAdmin()
  if (err) return err

  try {
    const { id } = await params
    const patch = await request.json() as Partial<PortfolioItem>
    const items = await getPortfolioItems()
    const idx = items.findIndex(i => i.id === id)
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    items[idx] = { ...items[idx], ...patch }
    await savePortfolioItems(items)
    return NextResponse.json(items[idx])
  } catch (e) {
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
    console.error('portfolio_patch_failed', {
      id,
      message: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack : undefined,
    })
    return NextResponse.json({ error: 'Internal portfolio error', id }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const err = await requireAdmin()
  if (err) return err

  try {
    const { id } = await params
    const items = await getPortfolioItems()
    const filtered = items.filter(i => i.id !== id).map((item, i) => ({ ...item, order: i }))
    await savePortfolioItems(filtered)
    return NextResponse.json({ ok: true })
  } catch (e) {
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
    console.error('portfolio_delete_failed', {
      id,
      message: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack : undefined,
    })
    return NextResponse.json({ error: 'Internal portfolio error', id }, { status: 500 })
  }
}
