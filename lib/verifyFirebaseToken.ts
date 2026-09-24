import { createRemoteJWKSet, jwtVerify } from 'jose'

// Verifies a Firebase ID token's signature against Google's public keys —
// no service-account secret needed, unlike the firebase-admin SDK's
// verifyIdToken/verifySessionCookie. See:
// https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library
const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
)

export interface FirebaseTokenPayload {
  uid: string
  email: string | null
}

export async function verifyFirebaseIdToken(idToken: string): Promise<FirebaseTokenPayload | null> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  if (!projectId) return null

  try {
    const { payload } = await jwtVerify(idToken, JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    })
    if (!payload.sub) return null
    return { uid: payload.sub, email: typeof payload.email === 'string' ? payload.email : null }
  } catch {
    return null
  }
}
