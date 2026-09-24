import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getCurrentAdmin } from '@/lib/requireAdmin'
import { setAdminUserDisabled, deleteAdminUser } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  const err = await requireAdmin()
  if (err) return err

  const { id } = await params
  const { disabled } = await request.json()

  const current = await getCurrentAdmin()
  if (current?.id === id && disabled) {
    return NextResponse.json({ error: 'You cannot disable your own account.' }, { status: 400 })
  }

  await setAdminUserDisabled(id, Boolean(disabled))
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const err = await requireAdmin()
  if (err) return err

  const { id } = await params
  const current = await getCurrentAdmin()
  if (current?.id === id) {
    return NextResponse.json({ error: 'You cannot remove your own account.' }, { status: 400 })
  }

  await deleteAdminUser(id)
  return NextResponse.json({ ok: true })
}
