import 'dotenv/config'
import bcrypt from 'bcrypt'
import { Pool } from 'pg'

const adminUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin'
const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin'
const adminNationalId = process.env.DEFAULT_ADMIN_NATIONAL_ID || '000000000001'
const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@Lockbox.local'

async function run() {
  const databaseUrl = process.env.TARGET_DATABASE_URL || process.argv[2] || process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('No database URL provided. Use TARGET_DATABASE_URL, CLI arg, or DATABASE_URL.')
  }

  const isSupabase = databaseUrl.includes('supabase.co') || databaseUrl.includes('pooler.supabase.com')
  const sslRejectUnauthorized = ['1', 'true', 'yes', 'on'].includes(
    (process.env.DB_SSL_REJECT_UNAUTHORIZED || 'false').toLowerCase()
  )

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: isSupabase
      ? {
          rejectUnauthorized: sslRejectUnauthorized,
        }
      : undefined,
  })

  try {
    await pool.query('SELECT NOW()')

    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50)')
    await pool.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique ON users(username) WHERE username IS NOT NULL'
    )

    const passwordHash = await bcrypt.hash(adminPassword, 10)

    const existingByUsername = await pool.query(
      `SELECT id FROM users WHERE role = 'admin' AND username = $1 LIMIT 1`,
      [adminUsername]
    )

    if (existingByUsername.rows.length > 0) {
      await pool.query(
        'UPDATE users SET password_hash = $1, is_active = true, updated_at = NOW() WHERE id = $2',
        [passwordHash, existingByUsername.rows[0].id]
      )
      console.log(`[admin-sync] Updated admin password for username=${adminUsername}`)
      return
    }

    const existingByNationalId = await pool.query(
      `SELECT id FROM users WHERE role = 'admin' AND national_id = $1 LIMIT 1`,
      [adminNationalId]
    )

    if (existingByNationalId.rows.length > 0) {
      await pool.query(
        `UPDATE users
         SET username = $1, password_hash = $2, is_active = true, updated_at = NOW()
         WHERE id = $3`,
        [adminUsername, passwordHash, existingByNationalId.rows[0].id]
      )
      console.log(`[admin-sync] Attached username and reset password for national_id=${adminNationalId}`)
      return
    }

    await pool.query(
      `INSERT INTO users (national_id, email, username, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, 'admin', true)`,
      [adminNationalId, adminEmail, adminUsername, passwordHash]
    )

    console.log(`[admin-sync] Created admin user username=${adminUsername}`)
  } finally {
    await pool.end()
  }
}

run().catch((error) => {
  console.error('[admin-sync] Failed:', error.message)
  process.exit(1)
})

