import { notFound } from 'next/navigation'
import { getPaymentRequest, setPaymentIntentId } from '@/lib/db'
import { getStripeClient, getPublishableKey } from '@/lib/stripe'
import PaymentForm from './PaymentForm'

export const dynamic = 'force-dynamic'

export default async function PayPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const req = await getPaymentRequest(token)
  if (!req) notFound()

  if (req.status === 'paid') {
    return (
      <div className="pay-page">
        <div className="pay-box pay-status-box">
          <span className="pay-status-icon">✦</span>
          <h1 className="pay-status-title">Already paid</h1>
          <p className="pay-status-body">This payment has already been completed. Thank you!</p>
        </div>
      </div>
    )
  }

  if (req.status !== 'pending') notFound()

  let publishableKey: string
  let clientSecret: string

  try {
    publishableKey = await getPublishableKey()
    const stripe = await getStripeClient()

    const REUSABLE = ['requires_payment_method', 'requires_confirmation', 'requires_action']

    async function freshIntent() {
      const pi = await stripe.paymentIntents.create({
        amount: req!.amount,
        currency: req!.currency,
        automatic_payment_methods: { enabled: true },
        description: req!.description,
        receipt_email: req!.client_email ?? undefined,
        metadata: { token, payment_request_id: req!.id },
      })
      await setPaymentIntentId(token, pi.id)
      return pi.client_secret!
    }

    if (req.stripe_payment_intent_id) {
      try {
        const pi = await stripe.paymentIntents.retrieve(req.stripe_payment_intent_id)
        clientSecret = REUSABLE.includes(pi.status) ? pi.client_secret! : await freshIntent()
      } catch {
        clientSecret = await freshIntent()
      }
    } else {
      clientSecret = await freshIntent()
    }
  } catch {
    return (
      <div className="pay-page">
        <div className="pay-box pay-status-box">
          <span className="pay-status-icon">✕</span>
          <h1 className="pay-status-title">Payments unavailable</h1>
          <p className="pay-status-body">
            Online payments are not available right now.<br />
            Please contact us at <a href="mailto:eventsinbloomdmv@gmail.com">eventsinbloomdmv@gmail.com</a> to arrange payment.
          </p>
        </div>
      </div>
    )
  }

  return (
    <PaymentForm
      publishableKey={publishableKey!}
      clientSecret={clientSecret!}
      amount={req.amount}
      currency={req.currency}
      description={req.description}
      clientName={req.client_name}
      token={token}
    />
  )
}
