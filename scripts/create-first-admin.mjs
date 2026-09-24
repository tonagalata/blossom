// One-time bootstrap: pre-approves the first admin email in the admin_users
// table. After this, invite further admins from the Users page instead.
//
// This app has no Firebase Admin SDK, so it can't create the Firebase
// account itself — the person just needs to go to /admin/login afterward
// and either "Sign in with Google" or "Create a password" using this exact
// email. Whichever they use first claims this row (see
// resolveAdminUserForLogin in lib/db.ts).
//
// Usage (env vars must already be loaded, e.g. via --env-file):
//   node --env-file=.env.local scripts/create-first-admin.mjs you@example.com "Your Name"

import { randomUUID } from 'crypto'
import { createClient } from '@libsql/client'

const [, , email, displayName] = process.argv

if (!email) {
  console.error('Usage: node --env-file=.env.local scripts/create-first-admin.mjs <email> ["Display Name"]')
  process.exit(1)
}

for (const name of ['TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN']) {
  if (!process.env[name]) {
    console.error(`Missing required env var: ${name}`)
    process.exit(1)
  }
}

const db = createClient({
  url: process.env.TURSO_DATABASE_URL.replace(/^libsql:\/\//, 'https://'),
  authToken: process.env.TURSO_AUTH_TOKEN,
})

async function main() {
  await db.execute({
    sql: 'CREATE TABLE IF NOT EXISTS admin_users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, display_name TEXT, created_at TEXT NOT NULL, disabled INTEGER NOT NULL DEFAULT 0, last_login_at TEXT)',
    args: [],
  })

  const existing = await db.execute({ sql: 'SELECT id FROM admin_users WHERE email = ?', args: [email] })
  if (existing.rows[0]) {
    console.log(`${email} is already an admin.`)
    return
  }

  await db.execute({
    sql: 'INSERT INTO admin_users (id, email, display_name, created_at) VALUES (?,?,?,?)',
    args: [`pending:${randomUUID()}`, email, displayName || null, new Date().toISOString()],
  })

  console.log(`Done. Go to /admin/login and sign in with Google or create a password, using ${email}.`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
