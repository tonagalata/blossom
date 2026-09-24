import { verifyFirebaseIdToken, type FirebaseTokenPayload } from './verifyFirebaseToken'

export const COOKIE_NAME = 'admin_fb_session'
// Firebase ID tokens expire after 1 hour; the client refreshes and re-syncs
// this cookie well before then via onIdTokenChanged (see lib/auth-context.tsx).
export const COOKIE_MAX_AGE_SECONDS = 60 * 55

export type SessionUser = FirebaseTokenPayload

export async function verifySessionCookie(cookie: string): Promise<SessionUser | null> {
  return verifyFirebaseIdToken(cookie)
}
