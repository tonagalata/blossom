import { createClient } from '@libsql/client'
import type { Inquiry, InquiryAttachment, PaymentRequest, MembershipPlan, Member, MemberInquiry, PortfolioItem } from './types'

function makeClient() {
  return createClient({
    url: (process.env.TURSO_DATABASE_URL || '').replace(/^libsql:\/\//, 'https://'),
    authToken: process.env.TURSO_AUTH_TOKEN,
  })
}

export let db = makeClient()

let ready: Promise<void> | null = null

async function init() {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id            TEXT PRIMARY KEY,
      created_at    TEXT NOT NULL,
      first_name    TEXT,
      last_name     TEXT,
      email         TEXT NOT NULL,
      phone         TEXT,
      event_type    TEXT,
      event_date    TEXT,
      guest_count   TEXT,
      venue         TEXT,
      budget        TEXT,
      color_palette TEXT,
      message       TEXT,
      read          INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS inquiry_attachments (
      id           TEXT PRIMARY KEY,
      inquiry_id   TEXT NOT NULL,
      filename     TEXT NOT NULL,
      content_type TEXT NOT NULL,
      storage_url  TEXT NOT NULL,
      FOREIGN KEY (inquiry_id) REFERENCES inquiries(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS payment_requests (
      id                       TEXT PRIMARY KEY,
      token                    TEXT UNIQUE NOT NULL,
      created_at               TEXT NOT NULL,
      amount                   INTEGER NOT NULL,
      currency                 TEXT NOT NULL DEFAULT 'usd',
      description              TEXT NOT NULL,
      client_name              TEXT,
      client_email             TEXT,
      status                   TEXT NOT NULL DEFAULT 'pending',
      paid_at                  TEXT,
      stripe_payment_intent_id TEXT
    );
    CREATE TABLE IF NOT EXISTS membership_plans (
      id               TEXT PRIMARY KEY,
      stripe_product_id TEXT,
      stripe_price_id  TEXT UNIQUE,
      name             TEXT NOT NULL,
      description      TEXT,
      amount           INTEGER NOT NULL,
      currency         TEXT NOT NULL DEFAULT 'usd',
      interval         TEXT NOT NULL DEFAULT 'month',
      features         TEXT NOT NULL DEFAULT '[]',
      active           INTEGER NOT NULL DEFAULT 1,
      sort_order       INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS members (
      id                   TEXT PRIMARY KEY,
      email                TEXT UNIQUE NOT NULL,
      first_name           TEXT,
      last_name            TEXT,
      password_hash        TEXT NOT NULL,
      created_at           TEXT NOT NULL,
      stripe_customer_id   TEXT,
      subscription_id      TEXT,
      subscription_status  TEXT,
      plan_id              TEXT,
      current_period_end   TEXT
    );
    CREATE TABLE IF NOT EXISTS member_inquiries (
      id         TEXT PRIMARY KEY,
      member_id  TEXT NOT NULL,
      created_at TEXT NOT NULL,
      subject    TEXT NOT NULL,
      message    TEXT NOT NULL,
      status     TEXT NOT NULL DEFAULT 'open',
      reply      TEXT,
      replied_at TEXT,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS portfolio_items (
      id         TEXT PRIMARY KEY,
      src        TEXT NOT NULL,
      alt        TEXT NOT NULL,
      title      TEXT NOT NULL,
      category   TEXT NOT NULL,
      wide       INTEGER NOT NULL DEFAULT 0,
      visible    INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `)

  // Seed portfolio if table is empty
  const count = await db.execute('SELECT COUNT(*) as n FROM portfolio_items')
  if ((count.rows[0].n as number) === 0) {
    for (const item of PORTFOLIO_SEED) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO portfolio_items (id, src, alt, title, category, wide, visible, sort_order, created_at)
              VALUES (?,?,?,?,?,?,?,?,?)`,
        args: [item.id, item.src, item.alt, item.title, item.category, item.wide ? 1 : 0, item.visible ? 1 : 0, item.order, item.createdAt],
      })
    }
  }
}

export function getDb(): Promise<typeof db> {
  if (!ready) ready = init().catch(async (err) => {
    // Reset so the next call retries with a fresh client
    ready = null
    db = makeClient()
    throw err
  })
  return ready.then(() => db)
}

// ─── Inquiries ────────────────────────────────────────────────────────────────

export async function listInquiries(): Promise<Inquiry[]> {
  const client = await getDb()
  const [inquiryRows, attachmentRows] = await Promise.all([
    client.execute('SELECT * FROM inquiries ORDER BY created_at DESC'),
    client.execute('SELECT * FROM inquiry_attachments'),
  ])
  const attachmentMap = new Map<string, InquiryAttachment[]>()
  for (const row of attachmentRows.rows) {
    const iid = row.inquiry_id as string
    if (!attachmentMap.has(iid)) attachmentMap.set(iid, [])
    attachmentMap.get(iid)!.push(row as unknown as InquiryAttachment)
  }
  return inquiryRows.rows.map(row => ({
    ...(row as unknown as Inquiry),
    attachments: attachmentMap.get(row.id as string) ?? [],
  }))
}

export async function markInquiryRead(id: string): Promise<void> {
  const client = await getDb()
  await client.execute({ sql: 'UPDATE inquiries SET read = 1 WHERE id = ?', args: [id] })
}

export async function deleteInquiry(id: string): Promise<void> {
  const client = await getDb()
  await client.execute({ sql: 'DELETE FROM inquiries WHERE id = ?', args: [id] })
}

// ─── Payment requests ─────────────────────────────────────────────────────────

export async function listPaymentRequests(): Promise<PaymentRequest[]> {
  const client = await getDb()
  const result = await client.execute('SELECT * FROM payment_requests ORDER BY created_at DESC')
  return result.rows as unknown as PaymentRequest[]
}

export async function getPaymentRequest(token: string): Promise<PaymentRequest | null> {
  const client = await getDb()
  const result = await client.execute({ sql: 'SELECT * FROM payment_requests WHERE token = ?', args: [token] })
  return (result.rows[0] as unknown as PaymentRequest) ?? null
}

export async function createPaymentRequest(req: Omit<PaymentRequest, 'created_at' | 'status' | 'paid_at' | 'stripe_payment_intent_id'>): Promise<void> {
  const client = await getDb()
  await client.execute({
    sql: `INSERT INTO payment_requests (id, token, created_at, amount, currency, description, client_name, client_email) VALUES (?,?,?,?,?,?,?,?)`,
    args: [req.id, req.token, new Date().toISOString(), req.amount, req.currency, req.description, req.client_name, req.client_email],
  })
}

export async function setPaymentIntentId(token: string, paymentIntentId: string): Promise<void> {
  const client = await getDb()
  await client.execute({ sql: 'UPDATE payment_requests SET stripe_payment_intent_id = ? WHERE token = ?', args: [paymentIntentId, token] })
}

export async function markPaymentPaid(paymentIntentId: string): Promise<void> {
  const client = await getDb()
  await client.execute({
    sql: `UPDATE payment_requests SET status = 'paid', paid_at = ? WHERE stripe_payment_intent_id = ?`,
    args: [new Date().toISOString(), paymentIntentId],
  })
}

export async function deletePaymentRequest(id: string): Promise<void> {
  const client = await getDb()
  await client.execute({ sql: 'DELETE FROM payment_requests WHERE id = ?', args: [id] })
}

// ─── Membership plans ─────────────────────────────────────────────────────────

export async function listPlans(activeOnly = false): Promise<MembershipPlan[]> {
  const client = await getDb()
  const sql = activeOnly
    ? 'SELECT * FROM membership_plans WHERE active = 1 ORDER BY sort_order ASC, amount ASC'
    : 'SELECT * FROM membership_plans ORDER BY sort_order ASC, amount ASC'
  const result = await client.execute(sql)
  return result.rows.map(r => ({
    ...(r as unknown as MembershipPlan),
    features: JSON.parse((r.features as string) || '[]'),
  }))
}

export async function getPlan(id: string): Promise<MembershipPlan | null> {
  const client = await getDb()
  const result = await client.execute({ sql: 'SELECT * FROM membership_plans WHERE id = ?', args: [id] })
  if (!result.rows[0]) return null
  const r = result.rows[0]
  return { ...(r as unknown as MembershipPlan), features: JSON.parse((r.features as string) || '[]') }
}

export async function createPlan(plan: Omit<MembershipPlan, 'active'>): Promise<void> {
  const client = await getDb()
  await client.execute({
    sql: `INSERT INTO membership_plans (id, stripe_product_id, stripe_price_id, name, description, amount, currency, interval, features, sort_order)
          VALUES (?,?,?,?,?,?,?,?,?,?)`,
    args: [plan.id, plan.stripe_product_id, plan.stripe_price_id, plan.name, plan.description, plan.amount, plan.currency, plan.interval, JSON.stringify(plan.features), plan.sort_order],
  })
}

export async function updatePlanStripe(id: string, stripeProductId: string, stripePriceId: string): Promise<void> {
  const client = await getDb()
  await client.execute({
    sql: 'UPDATE membership_plans SET stripe_product_id = ?, stripe_price_id = ? WHERE id = ?',
    args: [stripeProductId, stripePriceId, id],
  })
}

export async function updatePlan(id: string, patch: Partial<Pick<MembershipPlan, 'name' | 'description' | 'features' | 'active' | 'sort_order'>>): Promise<void> {
  const client = await getDb()
  const sets: string[] = []
  const args: (string | number | null)[] = []
  if (patch.name !== undefined)        { sets.push('name = ?');        args.push(patch.name) }
  if (patch.description !== undefined) { sets.push('description = ?'); args.push(patch.description) }
  if (patch.features !== undefined)    { sets.push('features = ?');    args.push(JSON.stringify(patch.features)) }
  if (patch.active !== undefined)      { sets.push('active = ?');      args.push(patch.active ? 1 : 0) }
  if (patch.sort_order !== undefined)  { sets.push('sort_order = ?');  args.push(patch.sort_order) }
  if (!sets.length) return
  args.push(id)
  await client.execute({ sql: `UPDATE membership_plans SET ${sets.join(', ')} WHERE id = ?`, args })
}

export async function deletePlan(id: string): Promise<void> {
  const client = await getDb()
  await client.execute({ sql: 'DELETE FROM membership_plans WHERE id = ?', args: [id] })
}

// ─── Members ──────────────────────────────────────────────────────────────────

export async function createMember(m: Pick<Member, 'id' | 'email' | 'first_name' | 'last_name' | 'password_hash'>): Promise<void> {
  const client = await getDb()
  await client.execute({
    sql: `INSERT INTO members (id, email, first_name, last_name, password_hash, created_at) VALUES (?,?,?,?,?,?)`,
    args: [m.id, m.email, m.first_name, m.last_name, m.password_hash, new Date().toISOString()],
  })
}

export async function getMemberByEmail(email: string): Promise<Member | null> {
  const client = await getDb()
  const result = await client.execute({ sql: 'SELECT * FROM members WHERE email = ?', args: [email] })
  return (result.rows[0] as unknown as Member) ?? null
}

export async function getMemberById(id: string): Promise<Member | null> {
  const client = await getDb()
  const result = await client.execute({ sql: 'SELECT * FROM members WHERE id = ?', args: [id] })
  return (result.rows[0] as unknown as Member) ?? null
}

export async function listMembers(): Promise<Member[]> {
  const client = await getDb()
  const result = await client.execute('SELECT * FROM members ORDER BY created_at DESC')
  return result.rows as unknown as Member[]
}

export async function updateMemberStripe(id: string, data: Partial<Pick<Member, 'stripe_customer_id' | 'subscription_id' | 'subscription_status' | 'plan_id' | 'current_period_end'>>): Promise<void> {
  const client = await getDb()
  const sets: string[] = []
  const args: (string | number | null)[] = []
  for (const [k, v] of Object.entries(data)) { sets.push(`${k} = ?`); args.push(v as string | number | null) }
  if (!sets.length) return
  args.push(id)
  await client.execute({ sql: `UPDATE members SET ${sets.join(', ')} WHERE id = ?`, args })
}

export async function getMemberByCustomerId(customerId: string): Promise<Member | null> {
  const client = await getDb()
  const result = await client.execute({ sql: 'SELECT * FROM members WHERE stripe_customer_id = ?', args: [customerId] })
  return (result.rows[0] as unknown as Member) ?? null
}

export async function getMemberBySubscriptionId(subscriptionId: string): Promise<Member | null> {
  const client = await getDb()
  const result = await client.execute({ sql: 'SELECT * FROM members WHERE subscription_id = ?', args: [subscriptionId] })
  return (result.rows[0] as unknown as Member) ?? null
}

// ─── Member inquiries ─────────────────────────────────────────────────────────

export async function listMemberInquiries(memberId: string): Promise<MemberInquiry[]> {
  const client = await getDb()
  const result = await client.execute({
    sql: 'SELECT * FROM member_inquiries WHERE member_id = ? ORDER BY created_at DESC',
    args: [memberId],
  })
  return result.rows as unknown as MemberInquiry[]
}

export async function listAllMemberInquiries(): Promise<(MemberInquiry & { member_email: string; member_name: string })[]> {
  const client = await getDb()
  const result = await client.execute(`
    SELECT mi.*, m.email as member_email,
      COALESCE(m.first_name || ' ' || m.last_name, m.email) as member_name
    FROM member_inquiries mi
    JOIN members m ON m.id = mi.member_id
    ORDER BY mi.created_at DESC
  `)
  return result.rows as unknown as (MemberInquiry & { member_email: string; member_name: string })[]
}

export async function createMemberInquiry(inq: Pick<MemberInquiry, 'id' | 'member_id' | 'subject' | 'message'>): Promise<void> {
  const client = await getDb()
  await client.execute({
    sql: `INSERT INTO member_inquiries (id, member_id, created_at, subject, message) VALUES (?,?,?,?,?)`,
    args: [inq.id, inq.member_id, new Date().toISOString(), inq.subject, inq.message],
  })
}

export async function replyToMemberInquiry(id: string, reply: string): Promise<void> {
  const client = await getDb()
  await client.execute({
    sql: `UPDATE member_inquiries SET reply = ?, replied_at = ?, status = 'replied' WHERE id = ?`,
    args: [reply, new Date().toISOString(), id],
  })
}

// ─── Portfolio ────────────────────────────────────────────────────────────────

export async function listPortfolioItems(): Promise<PortfolioItem[]> {
  const client = await getDb()
  const result = await client.execute('SELECT * FROM portfolio_items ORDER BY sort_order ASC, created_at ASC')
  return result.rows.map(r => ({
    id: r.id as string,
    src: r.src as string,
    alt: r.alt as string,
    title: r.title as string,
    category: r.category as PortfolioItem['category'],
    wide: r.wide === 1,
    visible: r.visible === 1,
    order: r.sort_order as number,
    createdAt: r.created_at as string,
  }))
}

export async function savePortfolioItems(items: PortfolioItem[]): Promise<void> {
  const client = await getDb()
  await client.execute('DELETE FROM portfolio_items')
  for (const item of items) {
    await client.execute({
      sql: `INSERT INTO portfolio_items (id, src, alt, title, category, wide, visible, sort_order, created_at)
            VALUES (?,?,?,?,?,?,?,?,?)`,
      args: [item.id, item.src, item.alt, item.title, item.category, item.wide ? 1 : 0, item.visible ? 1 : 0, item.order, item.createdAt],
    })
  }
}

// ─── Portfolio seed data ──────────────────────────────────────────────────────

const PORTFOLIO_SEED: PortfolioItem[] = [
  { id: 'arr1',  src: '/images/arrangements.PNG',      alt: 'Floral arrangement',      title: 'Garden Collection',      category: 'arrangements', wide: true,  visible: true, order: 0,  createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'arr2',  src: '/images/arrangements2.PNG',     alt: 'Seasonal arrangement',     title: 'Spring Blooms',          category: 'arrangements', wide: false, visible: true, order: 1,  createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'pe1',   src: '/images/private_event.PNG',     alt: 'Private event florals',    title: 'Spring Celebration',     category: 'events',       wide: false, visible: true, order: 2,  createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'arr3',  src: '/images/arrangements3.PNG',     alt: 'Floral arrangement',       title: 'Botanica Series',        category: 'arrangements', wide: false, visible: true, order: 3,  createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'arr4',  src: '/images/arrangements4.PNG',     alt: 'Floral arrangement',       title: 'Wildflower Edit',        category: 'arrangements', wide: false, visible: true, order: 4,  createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'pe3',   src: '/images/private_event3.PNG',    alt: 'Private event design',     title: 'Intimate Dinner',        category: 'events',       wide: true,  visible: true, order: 5,  createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'pe4',   src: '/images/private_event4.PNG',    alt: 'Event florals',            title: 'Birthday Soirée',        category: 'events',       wide: false, visible: true, order: 6,  createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'arr5',  src: '/images/arrangements5.PNG',     alt: 'Floral arrangement',       title: 'Fresh Cut Collection',   category: 'arrangements', wide: false, visible: true, order: 7,  createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'arr6',  src: '/images/arrangements6.PNG',     alt: 'Floral arrangement',       title: 'Signature Studio',       category: 'arrangements', wide: true,  visible: true, order: 8,  createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'arr7',  src: '/images/arrangements7.PNG',     alt: 'Floral arrangement',       title: 'Seasonal Edit',          category: 'arrangements', wide: true,  visible: true, order: 9,  createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'pe5',   src: '/images/private_event5.PNG',    alt: 'Private event',            title: 'Summer Gathering',       category: 'events',       wide: false, visible: true, order: 10, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'arr8',  src: '/images/arrangements8.PNG',     alt: 'Floral arrangement',       title: 'Pastel Dreams',          category: 'arrangements', wide: false, visible: true, order: 11, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'arr9',  src: '/images/arrangements9.PNG',     alt: 'Floral arrangement',       title: 'Studio Arrangement',     category: 'arrangements', wide: false, visible: true, order: 12, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'pe7',   src: '/images/private_event7.PNG',    alt: 'Private event',            title: 'Evening Reception',      category: 'events',       wide: false, visible: true, order: 13, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'ren1',  src: '/images/rental.PNG',            alt: 'Floral backdrop rental',   title: 'Floral Wall',            category: 'rentals',      wide: true,  visible: true, order: 14, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'ren2',  src: '/images/rental2.PNG',           alt: 'Backdrop rental setup',    title: 'Floral Backdrop Rental', category: 'rentals',      wide: false, visible: true, order: 15, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'ren3',  src: '/images/rental3.jpeg',          alt: 'Garden backdrop rental',   title: 'Garden Backdrop',        category: 'rentals',      wide: false, visible: true, order: 16, createdAt: '2025-01-01T00:00:00.000Z' },
]
