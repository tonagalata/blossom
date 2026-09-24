import { createClient } from '@libsql/client'
import type {
  Inquiry, InquiryAttachment, PaymentRequest, MembershipPlan, Member, MemberInquiry, PortfolioItem,
  Customer, Proposal, ProposalStatus, LineItem, ESignature, Invoice, InvoiceStatus, DashboardStats,
} from './types'

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
    CREATE TABLE IF NOT EXISTS customers (
      id         TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      first_name TEXT,
      last_name  TEXT,
      email      TEXT NOT NULL,
      phone      TEXT,
      company    TEXT,
      address    TEXT,
      notes      TEXT,
      source     TEXT NOT NULL DEFAULT 'manual',
      inquiry_id TEXT REFERENCES inquiries(id)
    );
    CREATE TABLE IF NOT EXISTS proposals (
      id                 TEXT PRIMARY KEY,
      created_at         TEXT NOT NULL,
      updated_at         TEXT NOT NULL,
      customer_id        TEXT NOT NULL REFERENCES customers(id),
      token              TEXT UNIQUE NOT NULL,
      title              TEXT NOT NULL,
      event_date         TEXT,
      status             TEXT NOT NULL DEFAULT 'draft',
      subtotal           INTEGER NOT NULL DEFAULT 0,
      tax_rate           REAL NOT NULL DEFAULT 0,
      tax_amount         INTEGER NOT NULL DEFAULT 0,
      total              INTEGER NOT NULL DEFAULT 0,
      currency           TEXT NOT NULL DEFAULT 'usd',
      valid_until        TEXT,
      notes              TEXT,
      terms              TEXT,
      sent_at            TEXT,
      viewed_at          TEXT,
      responded_at       TEXT,
      deposit_percentage REAL NOT NULL DEFAULT 0,
      payment_request_id TEXT REFERENCES payment_requests(id)
    );
    CREATE TABLE IF NOT EXISTS proposal_line_items (
      id          TEXT PRIMARY KEY,
      proposal_id TEXT NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
      title       TEXT NOT NULL,
      description TEXT,
      qty         REAL NOT NULL DEFAULT 1,
      unit_price  INTEGER NOT NULL,
      sort_order  INTEGER NOT NULL DEFAULT 0,
      image_url   TEXT
    );
    CREATE TABLE IF NOT EXISTS proposal_signatures (
      id             TEXT PRIMARY KEY,
      proposal_id    TEXT NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
      signer_name    TEXT NOT NULL,
      signer_email   TEXT NOT NULL,
      signature_data TEXT NOT NULL,
      signed_at      TEXT NOT NULL,
      ip_address     TEXT,
      user_agent     TEXT,
      document_hash  TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS invoices (
      id                 TEXT PRIMARY KEY,
      created_at         TEXT NOT NULL,
      updated_at         TEXT NOT NULL,
      customer_id        TEXT NOT NULL REFERENCES customers(id),
      proposal_id        TEXT REFERENCES proposals(id),
      token              TEXT UNIQUE NOT NULL,
      invoice_number     TEXT NOT NULL,
      status             TEXT NOT NULL DEFAULT 'draft',
      issue_date         TEXT,
      due_date           TEXT,
      subtotal           INTEGER NOT NULL DEFAULT 0,
      tax_rate           REAL NOT NULL DEFAULT 0,
      tax_amount         INTEGER NOT NULL DEFAULT 0,
      total              INTEGER NOT NULL DEFAULT 0,
      amount_paid        INTEGER NOT NULL DEFAULT 0,
      currency           TEXT NOT NULL DEFAULT 'usd',
      notes              TEXT,
      terms              TEXT,
      sent_at            TEXT,
      payment_request_id TEXT REFERENCES payment_requests(id)
    );
    CREATE TABLE IF NOT EXISTS invoice_line_items (
      id          TEXT PRIMARY KEY,
      invoice_id  TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      title       TEXT NOT NULL,
      description TEXT,
      qty         REAL NOT NULL DEFAULT 1,
      unit_price  INTEGER NOT NULL,
      sort_order  INTEGER NOT NULL DEFAULT 0,
      image_url   TEXT
    );
    CREATE TABLE IF NOT EXISTS invoice_signatures (
      id             TEXT PRIMARY KEY,
      invoice_id     TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      signer_name    TEXT NOT NULL,
      signer_email   TEXT NOT NULL,
      signature_data TEXT NOT NULL,
      signed_at      TEXT NOT NULL,
      ip_address     TEXT,
      user_agent     TEXT,
      document_hash  TEXT NOT NULL
    );
  `)

  // Backfill columns added after a table's first CREATE TABLE IF NOT EXISTS ran elsewhere.
  for (const [table, column, ddl] of [
    ['proposal_line_items', 'image_url', 'ALTER TABLE proposal_line_items ADD COLUMN image_url TEXT'],
    ['invoice_line_items', 'image_url', 'ALTER TABLE invoice_line_items ADD COLUMN image_url TEXT'],
    ['proposals', 'deposit_percentage', 'ALTER TABLE proposals ADD COLUMN deposit_percentage REAL NOT NULL DEFAULT 0'],
    ['proposals', 'payment_request_id', 'ALTER TABLE proposals ADD COLUMN payment_request_id TEXT REFERENCES payment_requests(id)'],
  ] as const) {
    try {
      await db.execute(ddl)
    } catch (err) {
      if (!(err instanceof Error) || !/duplicate column/i.test(err.message)) {
        console.error(`Migration failed for ${table}.${column}:`, err)
      }
    }
  }

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

// ─── Customers ────────────────────────────────────────────────────────────────

export async function listCustomers(): Promise<Customer[]> {
  const client = await getDb()
  const result = await client.execute('SELECT * FROM customers ORDER BY created_at DESC')
  return result.rows as unknown as Customer[]
}

export async function searchCustomers(q: string): Promise<Customer[]> {
  const client = await getDb()
  const like = `%${q}%`
  const result = await client.execute({
    sql: `SELECT * FROM customers
          WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR company LIKE ?
          ORDER BY created_at DESC`,
    args: [like, like, like, like],
  })
  return result.rows as unknown as Customer[]
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const client = await getDb()
  const result = await client.execute({ sql: 'SELECT * FROM customers WHERE id = ?', args: [id] })
  return (result.rows[0] as unknown as Customer) ?? null
}

export async function createCustomer(c: Omit<Customer, 'created_at'>): Promise<void> {
  const client = await getDb()
  await client.execute({
    sql: `INSERT INTO customers (id, created_at, first_name, last_name, email, phone, company, address, notes, source, inquiry_id)
          VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    args: [c.id, new Date().toISOString(), c.first_name, c.last_name, c.email, c.phone, c.company, c.address, c.notes, c.source, c.inquiry_id],
  })
}

export async function updateCustomer(id: string, patch: Partial<Pick<Customer, 'first_name' | 'last_name' | 'email' | 'phone' | 'company' | 'address' | 'notes'>>): Promise<void> {
  const client = await getDb()
  const sets: string[] = []
  const args: (string | null)[] = []
  for (const key of ['first_name', 'last_name', 'email', 'phone', 'company', 'address', 'notes'] as const) {
    if (patch[key] !== undefined) { sets.push(`${key} = ?`); args.push(patch[key] as string | null) }
  }
  if (!sets.length) return
  args.push(id)
  await client.execute({ sql: `UPDATE customers SET ${sets.join(', ')} WHERE id = ?`, args })
}

export async function deleteCustomer(id: string): Promise<void> {
  const client = await getDb()
  await client.execute({ sql: 'DELETE FROM customers WHERE id = ?', args: [id] })
}

// ─── Proposals ────────────────────────────────────────────────────────────────

function computeTotals(items: LineItem[], taxRate: number) {
  const subtotal = Math.round(items.reduce((sum, i) => sum + i.qty * i.unit_price, 0))
  const taxAmount = Math.round(subtotal * taxRate)
  return { subtotal, taxAmount, total: subtotal + taxAmount }
}

async function insertLineItems(client: typeof db, table: 'proposal_line_items' | 'invoice_line_items', parentCol: 'proposal_id' | 'invoice_id', parentId: string, items: LineItem[]) {
  await client.execute({ sql: `DELETE FROM ${table} WHERE ${parentCol} = ?`, args: [parentId] })
  for (const item of items) {
    await client.execute({
      sql: `INSERT INTO ${table} (id, ${parentCol}, title, description, qty, unit_price, sort_order, image_url) VALUES (?,?,?,?,?,?,?,?)`,
      args: [item.id, parentId, item.title, item.description, item.qty, item.unit_price, item.sort_order, item.image_url],
    })
  }
}

async function getLineItems(client: typeof db, table: 'proposal_line_items' | 'invoice_line_items', parentCol: 'proposal_id' | 'invoice_id', parentId: string): Promise<LineItem[]> {
  const result = await client.execute({
    sql: `SELECT * FROM ${table} WHERE ${parentCol} = ? ORDER BY sort_order ASC`,
    args: [parentId],
  })
  return result.rows.map(r => ({
    id: r.id as string, title: r.title as string, description: r.description as string | null,
    qty: r.qty as number, unit_price: r.unit_price as number, sort_order: r.sort_order as number,
    image_url: (r.image_url as string | null) ?? null,
  }))
}

async function getSignature(client: typeof db, table: 'proposal_signatures' | 'invoice_signatures', parentCol: 'proposal_id' | 'invoice_id', parentId: string): Promise<ESignature | null> {
  const result = await client.execute({ sql: `SELECT * FROM ${table} WHERE ${parentCol} = ?`, args: [parentId] })
  const r = result.rows[0]
  if (!r) return null
  return {
    id: r.id as string, signer_name: r.signer_name as string, signer_email: r.signer_email as string,
    signature_data: r.signature_data as string, signed_at: r.signed_at as string,
    ip_address: r.ip_address as string | null, user_agent: r.user_agent as string | null,
    document_hash: r.document_hash as string,
  }
}

export interface ProposalInput {
  id: string
  customer_id: string
  token: string
  title: string
  event_date: string | null
  valid_until: string | null
  notes: string | null
  terms: string | null
  tax_rate: number
  deposit_percentage: number
  line_items: LineItem[]
}

export async function createProposal(p: ProposalInput): Promise<void> {
  const client = await getDb()
  const { subtotal, taxAmount, total } = computeTotals(p.line_items, p.tax_rate)
  const now = new Date().toISOString()
  await client.execute({
    sql: `INSERT INTO proposals (id, created_at, updated_at, customer_id, token, title, event_date, status, subtotal, tax_rate, tax_amount, total, valid_until, notes, terms, deposit_percentage)
          VALUES (?,?,?,?,?,?,?,'draft',?,?,?,?,?,?,?,?)`,
    args: [p.id, now, now, p.customer_id, p.token, p.title, p.event_date, subtotal, p.tax_rate, taxAmount, total, p.valid_until, p.notes, p.terms, p.deposit_percentage],
  })
  await insertLineItems(client, 'proposal_line_items', 'proposal_id', p.id, p.line_items)
}

async function hydrateProposal(client: typeof db, row: Record<string, unknown>): Promise<Proposal> {
  const [line_items, signature, paymentRequest] = await Promise.all([
    getLineItems(client, 'proposal_line_items', 'proposal_id', row.id as string),
    getSignature(client, 'proposal_signatures', 'proposal_id', row.id as string),
    row.payment_request_id
      ? client.execute({ sql: 'SELECT token, status FROM payment_requests WHERE id = ?', args: [row.payment_request_id as string] })
      : Promise.resolve(null),
  ])
  return {
    ...(row as unknown as Proposal),
    line_items,
    signature,
    payment_request_token: (paymentRequest?.rows[0]?.token as string) ?? null,
    deposit_status: (paymentRequest?.rows[0]?.status as Proposal['deposit_status']) ?? null,
  }
}

export async function listProposals(filter?: { status?: ProposalStatus; customerId?: string }): Promise<Proposal[]> {
  const client = await getDb()
  const clauses: string[] = []
  const args: string[] = []
  if (filter?.status) { clauses.push('status = ?'); args.push(filter.status) }
  if (filter?.customerId) { clauses.push('customer_id = ?'); args.push(filter.customerId) }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const result = await client.execute({ sql: `SELECT * FROM proposals ${where} ORDER BY created_at DESC`, args })
  return Promise.all(result.rows.map(row => hydrateProposal(client, row as unknown as Record<string, unknown>)))
}

export async function getProposal(id: string): Promise<Proposal | null> {
  const client = await getDb()
  const result = await client.execute({ sql: 'SELECT * FROM proposals WHERE id = ?', args: [id] })
  if (!result.rows[0]) return null
  return hydrateProposal(client, result.rows[0] as unknown as Record<string, unknown>)
}

export async function getProposalByToken(token: string): Promise<Proposal | null> {
  const client = await getDb()
  const result = await client.execute({ sql: 'SELECT * FROM proposals WHERE token = ?', args: [token] })
  if (!result.rows[0]) return null
  return hydrateProposal(client, result.rows[0] as unknown as Record<string, unknown>)
}

export async function updateProposal(id: string, patch: Partial<Pick<Proposal, 'title' | 'event_date' | 'valid_until' | 'notes' | 'terms' | 'tax_rate' | 'status' | 'deposit_percentage'>> & { line_items?: LineItem[] }): Promise<void> {
  const client = await getDb()
  let taxRate = patch.tax_rate
  let items = patch.line_items
  if (items !== undefined) {
    await insertLineItems(client, 'proposal_line_items', 'proposal_id', id, items)
  }
  if (items !== undefined || taxRate !== undefined) {
    if (items === undefined) items = await getLineItems(client, 'proposal_line_items', 'proposal_id', id)
    if (taxRate === undefined) {
      const existing = await client.execute({ sql: 'SELECT tax_rate FROM proposals WHERE id = ?', args: [id] })
      taxRate = (existing.rows[0]?.tax_rate as number) ?? 0
    }
    const { subtotal, taxAmount, total } = computeTotals(items, taxRate)
    await client.execute({
      sql: 'UPDATE proposals SET subtotal = ?, tax_rate = ?, tax_amount = ?, total = ? WHERE id = ?',
      args: [subtotal, taxRate, taxAmount, total, id],
    })
  }
  const sets: string[] = ['updated_at = ?']
  const args: (string | number | null)[] = [new Date().toISOString()]
  for (const key of ['title', 'event_date', 'valid_until', 'notes', 'terms', 'status', 'deposit_percentage'] as const) {
    if (patch[key] !== undefined) { sets.push(`${key} = ?`); args.push(patch[key] as string | number) }
  }
  args.push(id)
  await client.execute({ sql: `UPDATE proposals SET ${sets.join(', ')} WHERE id = ?`, args })
}

export async function linkProposalPaymentRequest(proposalId: string, paymentRequestId: string): Promise<void> {
  const client = await getDb()
  await client.execute({ sql: 'UPDATE proposals SET payment_request_id = ?, updated_at = ? WHERE id = ?', args: [paymentRequestId, new Date().toISOString(), proposalId] })
}

export async function markProposalSent(id: string): Promise<void> {
  const client = await getDb()
  const now = new Date().toISOString()
  await client.execute({ sql: `UPDATE proposals SET status = 'sent', sent_at = ?, updated_at = ? WHERE id = ?`, args: [now, now, id] })
}

export async function markProposalViewed(token: string): Promise<void> {
  const client = await getDb()
  await client.execute({
    sql: `UPDATE proposals SET status = 'viewed', viewed_at = ? WHERE token = ? AND viewed_at IS NULL AND status = 'sent'`,
    args: [new Date().toISOString(), token],
  })
}

export async function addProposalSignature(proposalId: string, sig: Omit<ESignature, 'id'> & { id: string }, decision: 'accepted' | 'declined'): Promise<void> {
  const client = await getDb()
  await client.execute({
    sql: `INSERT INTO proposal_signatures (id, proposal_id, signer_name, signer_email, signature_data, signed_at, ip_address, user_agent, document_hash)
          VALUES (?,?,?,?,?,?,?,?,?)`,
    args: [sig.id, proposalId, sig.signer_name, sig.signer_email, sig.signature_data, sig.signed_at, sig.ip_address, sig.user_agent, sig.document_hash],
  })
  const now = new Date().toISOString()
  await client.execute({
    sql: `UPDATE proposals SET status = ?, responded_at = ?, updated_at = ? WHERE id = ?`,
    args: [decision, now, now, proposalId],
  })
}

export async function deleteProposal(id: string): Promise<void> {
  const client = await getDb()
  await client.execute({ sql: 'DELETE FROM proposals WHERE id = ?', args: [id] })
}

// ─── Invoices ─────────────────────────────────────────────────────────────────

export async function nextInvoiceNumber(): Promise<string> {
  const client = await getDb()
  const result = await client.execute('SELECT COUNT(*) as n FROM invoices')
  const n = (result.rows[0].n as number) + 1
  return `INV-${String(n).padStart(4, '0')}`
}

export interface InvoiceInput {
  id: string
  customer_id: string
  proposal_id: string | null
  token: string
  invoice_number: string
  issue_date: string | null
  due_date: string | null
  notes: string | null
  terms: string | null
  tax_rate: number
  line_items: LineItem[]
}

export async function createInvoice(inv: InvoiceInput): Promise<void> {
  const client = await getDb()
  const { subtotal, taxAmount, total } = computeTotals(inv.line_items, inv.tax_rate)
  const now = new Date().toISOString()
  await client.execute({
    sql: `INSERT INTO invoices (id, created_at, updated_at, customer_id, proposal_id, token, invoice_number, status, issue_date, due_date, subtotal, tax_rate, tax_amount, total, amount_paid, notes, terms)
          VALUES (?,?,?,?,?,?,?,'draft',?,?,?,?,?,?,0,?,?)`,
    args: [inv.id, now, now, inv.customer_id, inv.proposal_id, inv.token, inv.invoice_number, inv.issue_date, inv.due_date, subtotal, inv.tax_rate, taxAmount, total, inv.notes, inv.terms],
  })
  await insertLineItems(client, 'invoice_line_items', 'invoice_id', inv.id, inv.line_items)
}

async function hydrateInvoice(client: typeof db, row: Record<string, unknown>): Promise<Invoice> {
  const [line_items, signature, paymentRequest] = await Promise.all([
    getLineItems(client, 'invoice_line_items', 'invoice_id', row.id as string),
    getSignature(client, 'invoice_signatures', 'invoice_id', row.id as string),
    row.payment_request_id
      ? client.execute({ sql: 'SELECT token FROM payment_requests WHERE id = ?', args: [row.payment_request_id as string] })
      : Promise.resolve(null),
  ])
  return {
    ...(row as unknown as Invoice),
    line_items,
    signature,
    payment_request_token: (paymentRequest?.rows[0]?.token as string) ?? null,
  }
}

export async function listInvoices(filter?: { status?: InvoiceStatus; customerId?: string }): Promise<Invoice[]> {
  const client = await getDb()
  const clauses: string[] = []
  const args: string[] = []
  if (filter?.status) { clauses.push('status = ?'); args.push(filter.status) }
  if (filter?.customerId) { clauses.push('customer_id = ?'); args.push(filter.customerId) }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const result = await client.execute({ sql: `SELECT * FROM invoices ${where} ORDER BY created_at DESC`, args })
  return Promise.all(result.rows.map(row => hydrateInvoice(client, row as unknown as Record<string, unknown>)))
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const client = await getDb()
  const result = await client.execute({ sql: 'SELECT * FROM invoices WHERE id = ?', args: [id] })
  if (!result.rows[0]) return null
  return hydrateInvoice(client, result.rows[0] as unknown as Record<string, unknown>)
}

export async function getInvoiceByToken(token: string): Promise<Invoice | null> {
  const client = await getDb()
  const result = await client.execute({ sql: 'SELECT * FROM invoices WHERE token = ?', args: [token] })
  if (!result.rows[0]) return null
  return hydrateInvoice(client, result.rows[0] as unknown as Record<string, unknown>)
}

export async function updateInvoice(id: string, patch: Partial<Pick<Invoice, 'invoice_number' | 'issue_date' | 'due_date' | 'notes' | 'terms' | 'tax_rate' | 'status'>> & { line_items?: LineItem[] }): Promise<void> {
  const client = await getDb()
  let taxRate = patch.tax_rate
  let items = patch.line_items
  if (items !== undefined) {
    await insertLineItems(client, 'invoice_line_items', 'invoice_id', id, items)
  }
  if (items !== undefined || taxRate !== undefined) {
    if (items === undefined) items = await getLineItems(client, 'invoice_line_items', 'invoice_id', id)
    if (taxRate === undefined) {
      const existing = await client.execute({ sql: 'SELECT tax_rate FROM invoices WHERE id = ?', args: [id] })
      taxRate = (existing.rows[0]?.tax_rate as number) ?? 0
    }
    const { subtotal, taxAmount, total } = computeTotals(items, taxRate)
    await client.execute({
      sql: 'UPDATE invoices SET subtotal = ?, tax_rate = ?, tax_amount = ?, total = ? WHERE id = ?',
      args: [subtotal, taxRate, taxAmount, total, id],
    })
  }
  const sets: string[] = ['updated_at = ?']
  const args: (string | number | null)[] = [new Date().toISOString()]
  for (const key of ['invoice_number', 'issue_date', 'due_date', 'notes', 'terms', 'status'] as const) {
    if (patch[key] !== undefined) { sets.push(`${key} = ?`); args.push(patch[key] as string) }
  }
  args.push(id)
  await client.execute({ sql: `UPDATE invoices SET ${sets.join(', ')} WHERE id = ?`, args })
}

export async function markInvoiceSent(id: string): Promise<void> {
  const client = await getDb()
  const now = new Date().toISOString()
  await client.execute({ sql: `UPDATE invoices SET status = 'sent', sent_at = ?, updated_at = ? WHERE id = ?`, args: [now, now, id] })
}

export async function markInvoiceViewed(token: string): Promise<void> {
  const client = await getDb()
  await client.execute({
    sql: `UPDATE invoices SET status = 'viewed', updated_at = ? WHERE token = ? AND status = 'sent'`,
    args: [new Date().toISOString(), token],
  })
}

export async function addInvoiceSignature(invoiceId: string, sig: ESignature): Promise<void> {
  const client = await getDb()
  await client.execute({
    sql: `INSERT INTO invoice_signatures (id, invoice_id, signer_name, signer_email, signature_data, signed_at, ip_address, user_agent, document_hash)
          VALUES (?,?,?,?,?,?,?,?,?)`,
    args: [sig.id, invoiceId, sig.signer_name, sig.signer_email, sig.signature_data, sig.signed_at, sig.ip_address, sig.user_agent, sig.document_hash],
  })
}

export async function linkInvoicePaymentRequest(invoiceId: string, paymentRequestId: string): Promise<void> {
  const client = await getDb()
  await client.execute({ sql: 'UPDATE invoices SET payment_request_id = ?, updated_at = ? WHERE id = ?', args: [paymentRequestId, new Date().toISOString(), invoiceId] })
}

export async function recordManualInvoicePayment(id: string, amountCents: number): Promise<void> {
  const client = await getDb()
  const result = await client.execute({ sql: 'SELECT total, amount_paid FROM invoices WHERE id = ?', args: [id] })
  const row = result.rows[0]
  if (!row) return
  const amountPaid = (row.amount_paid as number) + amountCents
  const status: InvoiceStatus = amountPaid >= (row.total as number) ? 'paid' : 'partial'
  await client.execute({
    sql: 'UPDATE invoices SET amount_paid = ?, status = ?, updated_at = ? WHERE id = ?',
    args: [amountPaid, status, new Date().toISOString(), id],
  })
}

export async function applyInvoicePaymentByIntent(paymentIntentId: string): Promise<string | null> {
  const client = await getDb()
  const result = await client.execute({
    sql: `SELECT i.id as invoice_id, pr.amount as amount
          FROM payment_requests pr
          JOIN invoices i ON i.payment_request_id = pr.id
          WHERE pr.stripe_payment_intent_id = ?`,
    args: [paymentIntentId],
  })
  const row = result.rows[0]
  if (!row) return null
  await recordManualInvoicePayment(row.invoice_id as string, row.amount as number)
  return row.invoice_id as string
}

export async function deleteInvoice(id: string): Promise<void> {
  const client = await getDb()
  await client.execute({ sql: 'DELETE FROM invoices WHERE id = ?', args: [id] })
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getBusinessDashboardStats(): Promise<DashboardStats> {
  const client = await getDb()
  const [inquiries, invoicesOutstanding, proposalsPending, membersActive] = await Promise.all([
    client.execute(`SELECT COUNT(*) as n FROM inquiries WHERE read = 0`),
    client.execute(`SELECT COALESCE(SUM(total - amount_paid), 0) as n FROM invoices WHERE status IN ('sent','partial','overdue')`),
    client.execute(`SELECT COUNT(*) as n FROM proposals WHERE status IN ('sent','viewed')`),
    client.execute(`
      SELECT COUNT(*) as n, COALESCE(SUM(mp.amount), 0) as mrr
      FROM members m JOIN membership_plans mp ON mp.id = m.plan_id
      WHERE m.subscription_status = 'active'
    `),
  ])
  return {
    openInquiries: inquiries.rows[0].n as number,
    outstandingInvoiceTotal: invoicesOutstanding.rows[0].n as number,
    pendingProposals: proposalsPending.rows[0].n as number,
    activeMembers: membersActive.rows[0].n as number,
    mrr: membersActive.rows[0].mrr as number,
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
