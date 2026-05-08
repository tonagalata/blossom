import type { Metadata } from 'next'
import Footer from '@/components/Footer'
import InquiryForm from './InquiryForm'

export const metadata: Metadata = {
  title: 'Inquire — Events in Bloom',
  description: "Tell us about your event and let's create something beautiful together.",
}

export default function Inquiry() {
  return (
    <div className="inquiry-page">
      <div className="inquiry-layout">

        <div className="inquiry-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="images/private_event.PNG" alt="Floral event design" />
        </div>

        <div className="inquiry-content">
          <p className="section-eyebrow">Get In Touch</p>
          <h1 className="section-title">Tell us about<br /><em>your event</em></h1>
          <p className="section-body">
            We take on a limited number of events each season to ensure every client receives our full attention and care.
            Fill out the form below and we&apos;ll be in touch within 2 business days.
          </p>
          <InquiryForm />
        </div>
      </div>

      <Footer />
    </div>
  )
}
