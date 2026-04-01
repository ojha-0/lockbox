import pool from '../pool'

type ConsentStatus = 'GRANTED' | 'REVOKED' | 'BLOCKED'

let initialized = false

const ensureConsentsTable = async () => {
  if (initialized) return

  await pool.query(`
    CREATE TABLE IF NOT EXISTS citizen_consents (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      citizen_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      business_type VARCHAR(50) NOT NULL,
      status VARCHAR(20) NOT NULL CHECK (status IN ('GRANTED', 'REVOKED', 'BLOCKED')),
      notes TEXT,
      updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE (citizen_id, business_type)
    )
  `)

  await pool.query('CREATE INDEX IF NOT EXISTS idx_citizen_consents_citizen_id ON citizen_consents(citizen_id)')
  await pool.query('CREATE INDEX IF NOT EXISTS idx_citizen_consents_business_type ON citizen_consents(business_type)')

  initialized = true
}

export const getConsentByCitizenAndBusinessType = async (
  citizen_id: string,
  business_type: string
): Promise<{ status: ConsentStatus; notes: string | null } | null> => {
  await ensureConsentsTable()

  const result = await pool.query(
    `SELECT status, notes
     FROM citizen_consents
     WHERE citizen_id = $1 AND business_type = $2`,
    [citizen_id, business_type]
  )

  return result.rows[0] || null
}

export const upsertCitizenConsent = async (
  citizen_id: string,
  business_type: string,
  status: ConsentStatus,
  notes: string | null,
  updated_by: string
) => {
  await ensureConsentsTable()

  const result = await pool.query(
    `INSERT INTO citizen_consents (citizen_id, business_type, status, notes, updated_by)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (citizen_id, business_type)
     DO UPDATE SET status = EXCLUDED.status,
                   notes = EXCLUDED.notes,
                   updated_by = EXCLUDED.updated_by,
                   updated_at = NOW()
     RETURNING *`,
    [citizen_id, business_type, status, notes, updated_by]
  )

  return result.rows[0]
}

export const getConsentsByCitizen = async (citizen_id: string) => {
  await ensureConsentsTable()

  const result = await pool.query(
    `SELECT business_type, status, notes, updated_at
     FROM citizen_consents
     WHERE citizen_id = $1`,
    [citizen_id]
  )

  return result.rows
}
