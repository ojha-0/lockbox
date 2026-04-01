import pool from '../pool'
import { AuditTrail } from '../../types'

export const insertAuditTrail = async (
  citizen_id: string,
  verifier_id: string | null,
  verifier_org_id: string | null,
  action: string,
  fields_accessed: string[] | null,
  biometric_score: number | null,
  result_status: 'APPROVED' | 'BLOCKED' | 'PENDING' | null,
  purpose: string | null,
  risk_flag: string | null,
  ip_address: string | null,
  user_agent: string | null
): Promise<AuditTrail> => {
  const result = await pool.query(
    `INSERT INTO audit_trail (
      citizen_id, verifier_id, verifier_org_id, action, fields_accessed,
      biometric_score, result_status, purpose, risk_flag, ip_address, user_agent
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      citizen_id,
      verifier_id,
      verifier_org_id,
      action,
      fields_accessed ? JSON.stringify(fields_accessed) : null,
      biometric_score,
      result_status,
      purpose,
      risk_flag,
      ip_address,
      user_agent,
    ]
  )
  return result.rows[0]
}

export const getAuditTrailByCitizen = async (
  citizen_id: string,
  page: number = 1,
  limit: number = 20
): Promise<{ rows: AuditTrail[]; total: number }> => {
  const offset = (page - 1) * limit

  const countResult = await pool.query(
    `SELECT COUNT(*) as total FROM audit_trail WHERE citizen_id = $1`,
    [citizen_id]
  )
  const total = parseInt(countResult.rows[0].total, 10)

  const result = await pool.query(
    `SELECT a.*, vo.organization_name, vo.business_type
     FROM audit_trail a
     LEFT JOIN verifier_organizations vo ON vo.id = a.verifier_org_id
     WHERE a.citizen_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [citizen_id, limit, offset]
  )

  return {
    rows: result.rows,
    total,
  }
}

export const getAuditTrailById = async (id: string): Promise<AuditTrail | null> => {
  const result = await pool.query(
    `SELECT * FROM audit_trail WHERE id = $1`,
    [id]
  )
  return result.rows[0] || null
}

export const getAllAuditTrails = async (
  page: number = 1,
  limit: number = 50
): Promise<{ rows: AuditTrail[]; total: number }> => {
  const offset = (page - 1) * limit

  const countResult = await pool.query(
    `SELECT COUNT(*) as total FROM audit_trail`
  )
  const total = parseInt(countResult.rows[0].total, 10)

  const result = await pool.query(
    `SELECT * FROM audit_trail
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  )

  return {
    rows: result.rows,
    total,
  }
}

export const getAuditTrailByVerifier = async (
  verifier_id: string,
  page: number = 1,
  limit: number = 20
): Promise<{ rows: AuditTrail[]; total: number }> => {
  const offset = (page - 1) * limit

  const countResult = await pool.query(
    `SELECT COUNT(*) as total FROM audit_trail WHERE verifier_id = $1`,
    [verifier_id]
  )
  const total = parseInt(countResult.rows[0].total, 10)

  const result = await pool.query(
    `SELECT a.*, vo.organization_name, vo.business_type
     FROM audit_trail a
     LEFT JOIN verifier_organizations vo ON vo.id = a.verifier_org_id
     WHERE a.verifier_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [verifier_id, limit, offset]
  )

  return {
    rows: result.rows,
    total,
  }
}
