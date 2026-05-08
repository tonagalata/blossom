import { NextRequest, NextResponse } from 'next/server'
import { getMemberByEmail } from '@/lib/db'
import { signResetToken } from '@/lib/memberAuth'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  const { email } = await request.json() as { email: string }
  if (!email?.trim()) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
  }

  // Always return success to avoid leaking which emails are registered
  const member = await getMemberByEmail(email.toLowerCase().trim())
  if (member) {
    const token = await signResetToken(member.email)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/members/reset-password?token=${token}`
    await sendPasswordResetEmail(member.email, resetUrl).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
