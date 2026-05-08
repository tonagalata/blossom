import Link from 'next/link'

export const metadata = { title: 'Payment Confirmed — Events in Bloom' }

export default function PaySuccess() {
  return (
    <div className="pay-page">
      <div className="pay-box pay-status-box">
        <span className="pay-status-icon">✦</span>
        <p className="section-eyebrow">Payment Confirmed</p>
        <h1 className="pay-status-title">Thank you!</h1>
        <p className="pay-status-body">
          Your payment was received. You&apos;ll get a receipt by email shortly.<br />
          We&apos;re excited to work with you — we&apos;ll be in touch soon.
        </p>
        <Link href="/" className="btn btn-gold" style={{ marginTop: 24 }}>
          Back to Home
        </Link>
      </div>
    </div>
  )
}
