import Stripe from 'stripe'

function requireEnv(name: string): string {
  const val = process.env[name]
  if (!val) throw new Error(`${name} is not set. Add it to your environment variables.`)
  return val
}

export async function getStripeClient(): Promise<Stripe> {
  return new Stripe(requireEnv('STRIPE_SECRET_KEY'))
}

export async function getPublishableKey(): Promise<string> {
  return requireEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')
}

export async function getWebhookSecret(): Promise<string | null> {
  return process.env.STRIPE_WEBHOOK_SECRET ?? null
}
