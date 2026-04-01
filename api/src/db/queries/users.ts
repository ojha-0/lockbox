import pool from '../pool'
import bcrypt from 'bcrypt'
import { User } from '../../types'

let usernameSchemaReady = false

const ensureUsernameSchema = async (): Promise<void> => {
  if (usernameSchemaReady) return

  const adminUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin'
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin'
  const adminNationalId = process.env.DEFAULT_ADMIN_NATIONAL_ID || '000000000001'
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@nagarikid.local'

  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50)`)
  await pool.query(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique ON users(username) WHERE username IS NOT NULL`
  )

  const byUsername = await pool.query(
    `SELECT id, password_hash FROM users WHERE role = 'admin' AND username = $1 LIMIT 1`,
    [adminUsername]
  )

  const passwordHash = await bcrypt.hash(adminPassword, 10)

  if (byUsername.rows.length > 0) {
    await pool.query(
      `UPDATE users SET password_hash = $1, is_active = true WHERE id = $2`,
      [passwordHash, byUsername.rows[0].id]
    )
    usernameSchemaReady = true
    return
  }

  const byNationalId = await pool.query(
    `SELECT id FROM users WHERE role = 'admin' AND national_id = $1 LIMIT 1`,
    [adminNationalId]
  )

  if (byNationalId.rows.length > 0) {
    await pool.query(
      `UPDATE users
       SET username = $1, password_hash = $2, is_active = true
       WHERE id = $3`,
      [adminUsername, passwordHash, byNationalId.rows[0].id]
    )
  } else {
    await pool.query(
      `INSERT INTO users (national_id, email, username, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, 'admin', true)`,
      [adminNationalId, adminEmail, adminUsername, passwordHash]
    )
  }

  usernameSchemaReady = true
}

export const createUser = async (
  national_id: string,
  email: string,
  password_hash: string,
  role: 'citizen' | 'verifier' | 'admin'
): Promise<User> => {
  const result = await pool.query(
    `INSERT INTO users (national_id, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [national_id, email, password_hash, role]
  )
  return result.rows[0]
}

export const getUserByNationalId = async (national_id: string): Promise<User | null> => {
  const result = await pool.query(
    `SELECT * FROM users WHERE national_id = $1 AND is_active = true`,
    [national_id]
  )
  return result.rows[0] || null
}

export const getCitizenUserByIdentifier = async (
  identifier: string
): Promise<(User & { phone_number: string | null }) | null> => {
  const result = await pool.query(
    `SELECT u.*, cp.phone_number
     FROM users u
     LEFT JOIN citizen_profiles cp ON cp.user_id = u.id
     WHERE u.role = 'citizen'
       AND u.is_active = true
       AND (
         u.email = $1
         OR cp.phone_number = $1
       )
     LIMIT 1`,
    [identifier]
  )

  return result.rows[0] || null
}

export const getUserByUsername = async (username: string): Promise<User | null> => {
  await ensureUsernameSchema()
  const result = await pool.query(
    `SELECT * FROM users WHERE username = $1 AND is_active = true`,
    [username]
  )
  return result.rows[0] || null
}

export const getUserById = async (id: string): Promise<User | null> => {
  const result = await pool.query(
    `SELECT * FROM users WHERE id = $1 AND is_active = true`,
    [id]
  )
  return result.rows[0] || null
}

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const result = await pool.query(
    `SELECT * FROM users WHERE email = $1 AND is_active = true`,
    [email]
  )
  return result.rows[0] || null
}

export const updateLastLogin = async (user_id: string): Promise<void> => {
  await pool.query(
    `UPDATE users SET last_login = NOW() WHERE id = $1`,
    [user_id]
  )
}

export const nationalIdExists = async (national_id: string): Promise<boolean> => {
  const result = await pool.query(
    `SELECT EXISTS(SELECT 1 FROM users WHERE national_id = $1)`,
    [national_id]
  )
  return result.rows[0].exists
}

export const emailExists = async (email: string): Promise<boolean> => {
  const result = await pool.query(
    `SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)`,
    [email]
  )
  return result.rows[0].exists
}
