import { SignJWT, jwtVerify } from 'jose'

const COOKIE_NAME = 'admin-session'
const EXPIRES_IN = '7d'

function getSecret(): Uint8Array {
  const s = process.env.ADMIN_JWT_SECRET || 'dev-secret-change-me-in-production-32ch'
  return new TextEncoder().encode(s)
}

export async function signAdminToken(): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .sign(getSecret())
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload.role === 'admin'
  } catch {
    return false
  }
}

export { COOKIE_NAME }
