import type { Metadata } from 'next'
import Link from 'next/link'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Thank You — Events in Bloom',
}

export default function Thanks() {
  return (
    <div className="thanks-page">
      <div className="thanks-body">
        <div className="thanks-inner">
          <span className="thanks-icon">✦</span>
          <p className="section-eyebrow">Inquiry Received</p>
          <h1 className="section-title">Thank you for<br /><em>reaching out</em></h1>
          <p className="section-body">
            We&apos;ve received your inquiry and will be in touch within 2 business days.
            We can&apos;t wait to learn more about your vision and start creating something beautiful together.
          </p>
          <div className="thanks-links">
            <Link href="/portfolio" className="btn">View Portfolio</Link>
            <Link href="/" className="btn btn-gold">Back to Home</Link>
          </div>

          <div className="next-steps">
            <p className="next-steps-heading">Next Steps</p>
            <ol>
              <li><strong>Download the welcome packet below</strong> — it includes your booking terms and service agreement.</li>
              <li><strong>Fill in your details</strong> — complete the client information and review the agreement.</li>
              <li><strong>Return it to us</strong> — email the signed packet to <strong>eventsinbloomdmv@gmail.com</strong> to secure your date.</li>
            </ol>
            <a className="packet-download" href="/eventsinbloom_welcome_packet.pdf" download>
              <span className="packet-icon">⬇</span>
              <span className="packet-label">
                <strong>Client Welcome Packet &amp; Service Agreement</strong>
                Download, complete, and email back to confirm your booking
              </span>
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
