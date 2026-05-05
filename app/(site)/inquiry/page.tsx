import type { Metadata } from 'next'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Inquire — Events in Bloom',
  description: 'Tell us about your event and let\'s create something beautiful together.',
}

export default function Inquiry() {
  return (
    <div className="inquiry-page">
      <div className="inquiry-layout">

        <div className="inquiry-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="images/private_event.PNG"
            alt="Floral event design"
          />
        </div>

        <div className="inquiry-content">
          <p className="section-eyebrow">Get In Touch</p>
          <h1 className="section-title">Tell us about<br /><em>your event</em></h1>
          <p className="section-body">
            We take on a limited number of events each season to ensure every client receives our full attention and care.
            Fill out the form below and we&apos;ll be in touch within 2 business days.
          </p>

          <form
            className="inquiry-form"
            name="inquiry"
            method="POST"
            data-netlify="true"
            netlify-honeypot="bot-field"
            action="/thanks"
          >
            <input type="hidden" name="form-name" value="inquiry" />
            <p style={{ display: 'none' }}><label>Skip this: <input name="bot-field" /></label></p>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="firstName">First Name *</label>
                <input className="form-input" type="text" id="firstName" name="first_name" placeholder="Jane" required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="lastName">Last Name *</label>
                <input className="form-input" type="text" id="lastName" name="last_name" placeholder="Doe" required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email *</label>
                <input className="form-input" type="email" id="email" name="email" placeholder="jane@example.com" required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="phone">Phone</label>
                <input className="form-input" type="tel" id="phone" name="phone" placeholder="(555) 000-0000" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="eventType">Event Type *</label>
              <select className="form-select" id="eventType" name="event_type" required defaultValue="">
                <option value="" disabled>Select an event type</option>
                <option value="wedding">Wedding</option>
                <option value="engagement">Engagement Party</option>
                <option value="birthday">Birthday Celebration</option>
                <option value="baby-shower">Baby Shower</option>
                <option value="bridal-shower">Bridal Shower</option>
                <option value="corporate">Corporate Event</option>
                <option value="gala">Gala or Fundraiser</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="eventDate">Event Date *</label>
                <input className="form-input" type="date" id="eventDate" name="event_date" required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="guestCount">Estimated Guest Count</label>
                <input className="form-input" type="number" id="guestCount" name="guest_count" placeholder="100" min="1" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="budget">Estimated Budget</label>
                <select className="form-select" id="budget" name="budget" defaultValue="">
                  <option value="" disabled>Select a range</option>
                  <option value="under-2k">Under $2,000</option>
                  <option value="2-5k">$2,000 – $5,000</option>
                  <option value="5-10k">$5,000 – $10,000</option>
                  <option value="10-20k">$10,000 – $20,000</option>
                  <option value="20k+">$20,000+</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="venue">Venue / Location</label>
                <input className="form-input" type="text" id="venue" name="venue" placeholder="Venue name or city" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="colorPalette">Color Palette or Aesthetic</label>
              <input className="form-input" type="text" id="colorPalette" name="color_palette" placeholder="e.g. blush, ivory, sage — romantic garden style" />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="message">Tell Us About Your Vision *</label>
              <textarea
                className="form-textarea"
                id="message"
                name="message"
                placeholder="Share your vision, inspiration, must-haves, or anything else you'd like us to know…"
                required
              />
            </div>

            <p className="form-note">* Required fields. We respond within 2 business days.</p>
            <button type="submit" className="form-submit">Submit Inquiry</button>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  )
}
