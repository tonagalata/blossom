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
