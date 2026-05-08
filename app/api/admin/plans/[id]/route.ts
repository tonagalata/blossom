import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { updatePlan, deletePlan } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  const err = await requireAdmin()
  if (err) return err

  const { id } = await params
  const body = await request.json() as Record<string, unknown>

  await updatePlan(id, {
    name:        typeof body.name === 'string'        ? body.name        : undefined,
    description: typeof body.description === 'string' ? body.description : undefined,
    features:    Array.isArray(body.features)          ? body.features    : undefined,
    active:      typeof body.active === 'boolean'      ? (body.active ? 1 : 0) : undefined,
    sort_order:  typeof body.sort_order === 'number'   ? body.sort_order  : undefined,
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const err = await requireAdmin()
  if (err) return err

  const { id } = await params
  await deletePlan(id)
  return NextResponse.json({ ok: true })
}
