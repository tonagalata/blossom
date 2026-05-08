import Stripe from 'stripe'
import { getStripeConfig } from './store'

export async function getStripeClient(): Promise<Stripe> {
  const envKey = process.env.STRIPE_SECRET_KEY
  if (envKey) return new Stripe(envKey)

  const config = await getStripeConfig()
  if (!config?.secretKey) throw new Error('Stripe is not configured. Add your keys in Admin → Payments.')
  return new Stripe(config.secretKey)
}

export async function getPublishableKey(): Promise<string> {
  const envKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  if (envKey) return envKey

  const config = await getStripeConfig()
  if (!config?.publishableKey) throw new Error('Stripe is not configured.')
  return config.publishableKey
}

export async function getWebhookSecret(): Promise<string | null> {
  const envKey = process.env.STRIPE_WEBHOOK_SECRET
  if (envKey) return envKey

  const config = await getStripeConfig()
  return config?.webhookSecret ?? null
}
