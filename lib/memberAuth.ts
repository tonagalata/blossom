import { SignJWT, jwtVerify } from 'jose'

export const MEMBER_COOKIE = 'member-session'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days in seconds

function getSecret() {
  return new TextEncoder().encode(process.env.ADMIN_JWT_SECRET || 'dev-secret-change-me-in-production-32ch')
}

export async function signMemberToken(memberId: string, email: string): Promise<string> {
  return new SignJWT({ memberId, email, role: 'member' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())
}

export interface MemberPayload { memberId: string; email: string }

export async function verifyMemberToken(token: string): Promise<MemberPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    if (payload.role !== 'member') return null
    return { memberId: payload.memberId as string, email: payload.email as string }
  } catch {
    return null
  }
}

export async function signResetToken(email: string): Promise<string> {
  return new SignJWT({ email, purpose: 'reset' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(getSecret())
}

export async function verifyResetToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    if (payload.purpose !== 'reset') return null
    return payload.email as string
  } catch {
    return null
  }
}
