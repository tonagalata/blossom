import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getDb } from '@/lib/db'
import { saveUploadedImage } from '@/lib/store'
import { sendInquiryEmail } from '@/lib/email'

const MAX_FILES = 5
const MAX_FILE_BYTES = 8 * 1024 * 1024 // 8 MB

export async function POST(request: NextRequest) {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const str = (key: string): string | null => {
    const v = formData.get(key)
    return typeof v === 'string' && v.trim() ? v.trim() : null
  }

  const email = str('email')
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const id = randomUUID()
  const now = new Date().toISOString()

  const client = await getDb()

  await client.execute({
    sql: `INSERT INTO inquiries
      (id, created_at, first_name, last_name, email, phone, event_type,
       event_date, guest_count, venue, budget, color_palette, message)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [
      id, now,
      str('first_name'), str('last_name'), email,
      str('phone'), str('event_type'), str('event_date'),
      str('guest_count'), str('venue'), str('budget'),
      str('color_palette'), str('message'),
    ],
  })

  const files = (formData.getAll('attachments') as File[])
    .filter(f => f.size > 0 && f.size <= MAX_FILE_BYTES)
    .slice(0, MAX_FILES)

  for (const file of files) {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
    const storageKey = `inq-${id}-${randomUUID()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    const url = await saveUploadedImage(storageKey, buffer, file.type)

    await client.execute({
      sql: `INSERT INTO inquiry_attachments (id, inquiry_id, filename, content_type, storage_url)
            VALUES (?,?,?,?,?)`,
      args: [randomUUID(), id, file.name, file.type, url],
    })
  }

  await sendInquiryEmail({
    first_name: str('first_name'),
    last_name: str('last_name'),
    email,
    phone: str('phone'),
    event_type: str('event_type'),
    event_date: str('event_date'),
    guest_count: str('guest_count'),
    venue: str('venue'),
    budget: str('budget'),
    color_palette: str('color_palette'),
    message: str('message'),
    attachmentCount: files.length,
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
