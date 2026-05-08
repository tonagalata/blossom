'use client'
import { useMemo, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount / 100)
}

function CheckoutForm({ amount, currency, token }: { amount: number; currency: string; token: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements || !ready) return

    setProcessing(true)
    setError('')

    const { error: submitError } = await elements.submit()
    if (submitError) {
      setError(submitError.message ?? 'Please check your card details.')
      setProcessing(false)
      return
    }

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/pay/success?token=${token}`,
      },
    })

    if (stripeError) {
      setError(stripeError.message ?? 'Payment failed. Please try again.')
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="pay-form">
      <PaymentElement options={{ layout: 'tabs' }} onReady={() => setReady(true)} />
      {!ready && <p className="pay-loading">Loading payment form…</p>}
      {error && <p className="pay-error">{error}</p>}
      <button
        type="submit"
        className="btn btn-gold pay-submit"
        disabled={!stripe || !ready || processing}
      >
        {processing ? 'Processing…' : `Pay ${fmt(amount, currency)}`}
      </button>
    </form>
  )
}

interface Props {
  publishableKey: string
  clientSecret: string
  amount: number
  currency: string
  description: string
  clientName: string | null
  token: string
}

export default function PaymentForm({ publishableKey, clientSecret, amount, currency, description, clientName, token }: Props) {
  const stripePromise = useMemo(() => loadStripe(publishableKey), [publishableKey])

  return (
    <div className="pay-page">
      <div className="pay-box">
        <div className="pay-brand">
          <span className="logo-bloom">Events</span>
          <span className="logo-bloom"> in </span>
          <span className="logo-bloom">Bloom</span>
        </div>

        <div className="pay-details">
          {clientName && <p className="pay-client">For {clientName}</p>}
          <p className="pay-description">{description}</p>
          <p className="pay-amount">{fmt(amount, currency)}</p>
        </div>

        <div className="pay-divider" />

        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#B8946A',
                colorBackground: '#ffffff',
                fontFamily: 'Jost, system-ui, sans-serif',
                borderRadius: '0px',
              },
            },
          }}
        >
          <CheckoutForm amount={amount} currency={currency} token={token} />
        </Elements>

        <p className="pay-secure">Secured by Stripe · SSL encrypted</p>
      </div>
    </div>
  )
}
