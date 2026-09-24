import nodemailer from 'nodemailer'

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT || '587'),
    secure: process.env.MAIL_SECURE === 'true',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
  })
}

export interface InquiryData {
  first_name: string | null
  last_name: string | null
  email: string
  phone: string | null
  event_type: string | null
  event_date: string | null
  guest_count: string | null
  venue: string | null
  budget: string | null
  color_palette: string | null
  message: string | null
  attachmentCount: number
}

export async function sendInquiryEmail(data: InquiryData) {
  const fromName = process.env.MAIL_FROM_NAME || 'Events in Bloom'
  const fromAddr = process.env.MAIL_FROM || process.env.MAIL_USER
  const toAddr = process.env.INQUIRY_TO || 'eventsinbloomdmv@gmail.com'
  const transporter = getTransporter()

  const name = [data.first_name, data.last_name].filter(Boolean).join(' ') || 'Unknown'

  const rows: [string, string | null][] = [
    ['Name', name],
    ['Email', data.email],
    ['Phone', data.phone],
    ['Event Type', data.event_type],
    ['Event Date', data.event_date],
    ['Guest Count', data.guest_count],
    ['Venue', data.venue],
    ['Budget', data.budget],
    ['Color Palette', data.color_palette],
    ['Message', data.message],
  ]

  const textLines = rows
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')

  const htmlRows = rows
    .filter(([, v]) => v)
    .map(([k, v]) => `
      <tr>
        <td style="padding:8px 12px;font-size:0.8rem;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.05em;white-space:nowrap;vertical-align:top">${k}</td>
        <td style="padding:8px 12px;font-size:0.95rem;color:#1E1E1A;white-space:pre-wrap">${v}</td>
      </tr>`)
    .join('')

  await transporter.sendMail({
    from: `"${fromName}" <${fromAddr}>`,
    to: toAddr,
    replyTo: `"${name}" <${data.email}>`,
    subject: `New Inquiry from ${name}`,
    text: `New inquiry received\n\n${textLines}${data.attachmentCount > 0 ? `\n\nAttachments: ${data.attachmentCount} file(s) — view in admin dashboard` : ''}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px">
        <p style="font-size:1.1rem;font-weight:700;margin:0 0 4px">Events in Bloom</p>
        <p style="font-size:0.8rem;color:#888;margin:0 0 24px;letter-spacing:0.1em;text-transform:uppercase">New Inquiry</p>
        <table style="width:100%;border-collapse:collapse;background:#fafaf7;border-radius:8px;overflow:hidden">
          ${htmlRows}
        </table>
        ${data.attachmentCount > 0 ? `<p style="margin:20px 0 0;font-size:0.85rem;color:#888">${data.attachmentCount} attachment(s) — view in your admin dashboard.</p>` : ''}
      </div>
    `,
  })
}

function fmtMoney(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100)
}

function ctaEmail({ to, subject, heading, intro, ctaLabel, ctaUrl, footer }: {
  to: string; subject: string; heading: string; intro: string; ctaLabel: string; ctaUrl: string; footer?: string
}) {
  const fromName = process.env.MAIL_FROM_NAME || 'Events in Bloom'
  const fromAddr = process.env.MAIL_FROM || process.env.MAIL_USER
  return {
    from: `"${fromName}" <${fromAddr}>`,
    to,
    subject,
    text: `${heading}\n\n${intro}\n\n${ctaUrl}${footer ? `\n\n${footer}` : ''}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px">
        <p style="font-size:1.1rem;font-weight:700;margin:0 0 4px">Events in Bloom</p>
        <p style="font-size:0.8rem;color:#888;margin:0 0 24px;letter-spacing:0.1em;text-transform:uppercase">${heading}</p>
        <p style="margin:0 0 24px;color:#333;font-size:0.95rem;line-height:1.6">${intro}</p>
        <a href="${ctaUrl}" style="display:inline-block;padding:12px 28px;background:#1E1E1A;color:#fff;text-decoration:none;font-size:0.85rem;letter-spacing:0.1em;text-transform:uppercase">
          ${ctaLabel}
        </a>
        ${footer ? `<p style="margin:24px 0 0;font-size:0.85rem;color:#888">${footer}</p>` : ''}
        <p style="margin:8px 0 0;font-size:0.8rem;color:#aaa">Or copy this link: ${ctaUrl}</p>
      </div>
    `,
  }
}

export async function sendProposalEmail(data: { to: string; customerName: string; title: string; total: number; currency: string; link: string }) {
  const transporter = getTransporter()
  await transporter.sendMail(ctaEmail({
    to: data.to,
    subject: `Your proposal: ${data.title}`,
    heading: 'New Proposal',
    intro: `Hi ${data.customerName}, we've put together a proposal for "${data.title}" totaling ${fmtMoney(data.total, data.currency)}. Please review and let us know if you'd like to move forward.`,
    ctaLabel: 'View Proposal',
    ctaUrl: data.link,
  }))
}

export async function sendProposalAcceptedEmail(data: { customerName: string; title: string; adminLink: string }) {
  const fromName = process.env.MAIL_FROM_NAME || 'Events in Bloom'
  const fromAddr = process.env.MAIL_FROM || process.env.MAIL_USER
  const toAddr = process.env.INQUIRY_TO || 'eventsinbloomdmv@gmail.com'
  const transporter = getTransporter()
  await transporter.sendMail({
    from: `"${fromName}" <${fromAddr}>`,
    to: toAddr,
    subject: `Proposal accepted: ${data.title}`,
    text: `${data.customerName} accepted the proposal "${data.title}".\n\n${data.adminLink}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px">
        <p style="font-size:1.1rem;font-weight:700;margin:0 0 4px">Events in Bloom</p>
        <p style="font-size:0.8rem;color:#2e7d32;margin:0 0 24px;letter-spacing:0.1em;text-transform:uppercase">Proposal Accepted</p>
        <p style="margin:0 0 24px;color:#333;font-size:0.95rem">${data.customerName} accepted <strong>${data.title}</strong>.</p>
        <a href="${data.adminLink}" style="display:inline-block;padding:12px 28px;background:#1E1E1A;color:#fff;text-decoration:none;font-size:0.85rem;letter-spacing:0.1em;text-transform:uppercase">View in Admin</a>
      </div>
    `,
  })
}

export async function sendProposalDeclinedEmail(data: { customerName: string; title: string; adminLink: string }) {
  const fromName = process.env.MAIL_FROM_NAME || 'Events in Bloom'
  const fromAddr = process.env.MAIL_FROM || process.env.MAIL_USER
  const toAddr = process.env.INQUIRY_TO || 'eventsinbloomdmv@gmail.com'
  const transporter = getTransporter()
  await transporter.sendMail({
    from: `"${fromName}" <${fromAddr}>`,
    to: toAddr,
    subject: `Proposal declined: ${data.title}`,
    text: `${data.customerName} declined the proposal "${data.title}".\n\n${data.adminLink}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px">
        <p style="font-size:1.1rem;font-weight:700;margin:0 0 4px">Events in Bloom</p>
        <p style="font-size:0.8rem;color:#c62828;margin:0 0 24px;letter-spacing:0.1em;text-transform:uppercase">Proposal Declined</p>
        <p style="margin:0 0 24px;color:#333;font-size:0.95rem">${data.customerName} declined <strong>${data.title}</strong>.</p>
        <a href="${data.adminLink}" style="display:inline-block;padding:12px 28px;background:#1E1E1A;color:#fff;text-decoration:none;font-size:0.85rem;letter-spacing:0.1em;text-transform:uppercase">View in Admin</a>
      </div>
    `,
  })
}

export async function sendInvoiceEmail(data: { to: string; customerName: string; invoiceNumber: string; total: number; currency: string; link: string }) {
  const transporter = getTransporter()
  await transporter.sendMail(ctaEmail({
    to: data.to,
    subject: `Invoice ${data.invoiceNumber} from Events in Bloom`,
    heading: 'New Invoice',
    intro: `Hi ${data.customerName}, invoice ${data.invoiceNumber} for ${fmtMoney(data.total, data.currency)} is ready for your review and payment.`,
    ctaLabel: 'View & Pay Invoice',
    ctaUrl: data.link,
  }))
}

export async function sendInvoicePaidEmail(data: { to: string; customerName: string; invoiceNumber: string; total: number; currency: string; link: string }) {
  const transporter = getTransporter()
  await transporter.sendMail(ctaEmail({
    to: data.to,
    subject: `Payment received — Invoice ${data.invoiceNumber}`,
    heading: 'Payment Received',
    intro: `Hi ${data.customerName}, thank you! We've received your payment of ${fmtMoney(data.total, data.currency)} for invoice ${data.invoiceNumber}.`,
    ctaLabel: 'View Invoice',
    ctaUrl: data.link,
  }))
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const fromName = process.env.MAIL_FROM_NAME || 'Events in Bloom'
  const fromAddr = process.env.MAIL_FROM || process.env.MAIL_USER
  const transporter = getTransporter()
  await transporter.sendMail({
    from: `"${fromName}" <${fromAddr}>`,
    to,
    subject: 'Reset your password',
    text: `Click the link below to reset your password. This link expires in 15 minutes.\n\n${resetUrl}\n\nIf you didn't request this, you can ignore this email.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <p style="font-size:1.2rem;font-weight:700;margin:0 0 16px">Events in Bloom</p>
        <p style="margin:0 0 24px;color:#333">Click the button below to reset your password. This link expires in <strong>15 minutes</strong>.</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 28px;background:#1E1E1A;color:#fff;text-decoration:none;font-size:0.85rem;letter-spacing:0.1em;text-transform:uppercase">
          Reset Password
        </a>
        <p style="margin:24px 0 0;font-size:0.85rem;color:#888">If you didn't request this, you can ignore this email.</p>
        <p style="margin:8px 0 0;font-size:0.8rem;color:#aaa">Or copy this link: ${resetUrl}</p>
      </div>
    `,
  })
}
