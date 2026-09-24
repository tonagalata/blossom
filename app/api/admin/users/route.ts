import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { listAdminUsers, createAdminUser } from '@/lib/db'
import { sendAdminInviteEmail } from '@/lib/email'

export async function GET() {
  const err = await requireAdmin()
  if (err) return err

  const users = await listAdminUsers()
  return NextResponse.json({ users })
}

export async function POST(request: NextRequest) {
  const err = await requireAdmin()
  if (err) return err

  const { email, displayName } = await request.json() as { email: string; displayName?: string }
  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
  }

  // No Firebase account is created here — there's no Admin SDK in this app.
  // The row is keyed by a placeholder id and gets claimed by the real
  // Firebase uid the first time this email successfully signs in (Google or
  // a self-created password account), via resolveAdminUserForLogin in lib/db.ts.
  try {
    await createAdminUser({ id: `pending:${randomUUID()}`, email, display_name: displayName || null })
  } catch {
    return NextResponse.json({ error: 'This user is already an admin.' }, { status: 409 })
  }

  await sendAdminInviteEmail({ to: email, displayName: displayName || email }).catch(() => {})

  return NextResponse.json({ ok: true })
}
