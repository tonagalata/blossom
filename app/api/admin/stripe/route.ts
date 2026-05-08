import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { getStripeConfig, saveStripeConfig } from '@/lib/store'

export async function GET() {
  const err = await requireAdmin()
  if (err) return err

  const config = await getStripeConfig()
  if (!config) return NextResponse.json({ connected: false })

  return NextResponse.json({
    connected: true,
    publishableKey: config.publishableKey,
    // mask secret key — show prefix + last 4 chars only
    secretKeyMasked: config.secretKey.slice(0, 8) + '••••••••' + config.secretKey.slice(-4),
    hasWebhookSecret: Boolean(config.webhookSecret),
  })
}

export async function PUT(request: NextRequest) {
  const err = await requireAdmin()
  if (err) return err

  const body = await request.json()
  const { publishableKey, secretKey, webhookSecret } = body as Record<string, string>

  if (!publishableKey?.startsWith('pk_') || !secretKey?.startsWith('sk_')) {
    return NextResponse.json(
      { error: 'Invalid keys. Publishable key must start with pk_ and secret key with sk_.' },
      { status: 400 }
    )
  }

  const existing = await getStripeConfig()
  await saveStripeConfig({
    publishableKey: publishableKey.trim(),
    secretKey: secretKey.trim(),
    webhookSecret: webhookSecret?.trim() || existing?.webhookSecret,
  })

  return NextResponse.json({ ok: true })
}
