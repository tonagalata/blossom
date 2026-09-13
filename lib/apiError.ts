import { NextResponse } from 'next/server'

// Response is only ever sent to a request that already passed requireAdmin(),
// so it's safe to include the raw error message here — it saves a trip to the
// Netlify function logs to see what actually broke.
export function adminApiError(action: string, e: unknown) {
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  const message = e instanceof Error ? e.message : String(e)
  console.error(`${action}_failed`, { id, message, stack: e instanceof Error ? e.stack : undefined })
  return NextResponse.json({ error: `Failed to ${action}`, message, id }, { status: 500 })
}
