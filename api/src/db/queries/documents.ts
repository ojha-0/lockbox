import pool from '../pool'
import { CitizenDocument } from '../../types'

let initialized = false

export const DOCUMENT_FIELD_MAP: Record<string, string[]> = {
  national_id: ['full_name', 'date_of_birth', 'gender', 'address'],
  passport: ['full_name', 'date_of_birth', 'gender', 'address'],
  citizenship: ['full_name', 'date_of_birth', 'gender', 'address'],
  driving_license: ['full_name', 'date_of_birth', 'address'],
  proof_of_residence: ['address'],
  insurance_card: ['full_name', 'date_of_birth', 'blood_group'],
  medical_report: ['full_name', 'blood_group'],
}

const ensureDocumentsTable = async () => {
  if (initialized) return

  await pool.query(`
    CREATE TABLE IF NOT EXISTS citizen_documents (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      citizen_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      document_type VARCHAR(50) NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_type VARCHAR(100) NOT NULL,
      file_size BIGINT NOT NULL,
      storage_url TEXT,
      upload_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (upload_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
      uploaded_at TIMESTAMP DEFAULT NOW(),
      verified_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `)

  await pool.query('CREATE INDEX IF NOT EXISTS idx_citizen_documents_citizen_id ON citizen_documents(citizen_id)')
  await pool.query('CREATE INDEX IF NOT EXISTS idx_citizen_documents_uploaded_at ON citizen_documents(uploaded_at DESC)')
  await pool.query('ALTER TABLE citizen_documents ADD COLUMN IF NOT EXISTS reviewed_by UUID NULL REFERENCES users(id) ON DELETE SET NULL')
  await pool.query('ALTER TABLE citizen_documents ADD COLUMN IF NOT EXISTS review_notes TEXT NULL')
    await pool.query("ALTER TABLE citizen_documents ADD COLUMN IF NOT EXISTS extracted_fields JSONB NOT NULL DEFAULT '[]'::jsonb")

  initialized = true
}

export const createCitizenDocument = async (
  citizen_id: string,
  document_type: string,
  file_name: string,
  file_type: string,
  file_size: number,
  storage_url: string | null = null
): Promise<CitizenDocument> => {
  await ensureDocumentsTable()

  const normalizedType = document_type.toLowerCase()
  const extracted_fields = DOCUMENT_FIELD_MAP[normalizedType] || []

  const result = await pool.query(
    `INSERT INTO citizen_documents (citizen_id, document_type, file_name, file_type, file_size, storage_url, extracted_fields)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [citizen_id, normalizedType, file_name, file_type, file_size, storage_url, JSON.stringify(extracted_fields)]
  )

  return result.rows[0]
}

export const getDocumentsByCitizenId = async (citizen_id: string): Promise<CitizenDocument[]> => {
  await ensureDocumentsTable()

  const result = await pool.query(
    `SELECT * FROM citizen_documents
     WHERE citizen_id = $1
     ORDER BY uploaded_at DESC`,
    [citizen_id]
  )

  return result.rows
}

export const getPendingDocuments = async (): Promise<CitizenDocument[]> => {
  await ensureDocumentsTable()

  const result = await pool.query(
    `SELECT d.*, cp.full_name, u.national_id
     FROM citizen_documents d
     JOIN users u ON u.id = d.citizen_id
     LEFT JOIN citizen_profiles cp ON cp.user_id = u.id
     WHERE d.upload_status = 'PENDING'
     ORDER BY d.uploaded_at ASC`
  )

  return result.rows
}

export const getDocumentsForAdmin = async (
  status?: 'PENDING' | 'VERIFIED' | 'REJECTED'
): Promise<CitizenDocument[]> => {
  await ensureDocumentsTable()

  const values: any[] = []
  let whereSql = ''

  if (status) {
    values.push(status)
    whereSql = 'WHERE d.upload_status = $1'
  }

  const result = await pool.query(
    `SELECT d.*, cp.full_name, u.national_id, u.email AS citizen_email
     FROM citizen_documents d
     JOIN users u ON u.id = d.citizen_id
     LEFT JOIN citizen_profiles cp ON cp.user_id = u.id
     ${whereSql}
     ORDER BY d.uploaded_at DESC`,
    values
  )

  return result.rows
}

export const reviewDocumentByAdmin = async (
  id: string,
  admin_user_id: string,
  decision: 'APPROVE' | 'REJECT',
  review_notes: string | null
): Promise<CitizenDocument | null> => {
  await ensureDocumentsTable()

  const upload_status = decision === 'APPROVE' ? 'VERIFIED' : 'REJECTED'
  const verified_at_sql = decision === 'APPROVE' ? 'NOW()' : 'NULL'

  const result = await pool.query(
    `UPDATE citizen_documents
     SET upload_status = $2,
         verified_at = ${verified_at_sql},
         reviewed_by = $3,
         review_notes = $4,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, upload_status, admin_user_id, review_notes]
  )

  return result.rows[0] || null
}

export const getVerifiedFieldsForCitizen = async (citizen_id: string): Promise<string[]> => {
  await ensureDocumentsTable()

  const result = await pool.query(
    `SELECT extracted_fields
     FROM citizen_documents
     WHERE citizen_id = $1 AND upload_status = 'VERIFIED'`,
    [citizen_id]
  )

  const fieldSet = new Set<string>()
  for (const row of result.rows) {
    const fields: string[] = Array.isArray(row.extracted_fields) ? row.extracted_fields : []
    for (const field of fields) {
      fieldSet.add(field)
    }
  }

  return Array.from(fieldSet)
}

export const getDocumentById = async (id: string): Promise<CitizenDocument | null> => {
  await ensureDocumentsTable()

  const result = await pool.query(
    `SELECT * FROM citizen_documents WHERE id = $1`,
    [id]
  )

  return result.rows[0] || null
}

export const deleteDocumentById = async (id: string, citizen_id: string): Promise<boolean> => {
  await ensureDocumentsTable()

  const result = await pool.query(
    `DELETE FROM citizen_documents WHERE id = $1 AND citizen_id = $2`,
    [id, citizen_id]
  )

  return result.rowCount > 0
}