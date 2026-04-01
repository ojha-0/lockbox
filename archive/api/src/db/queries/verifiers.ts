import pool from '../pool'
import { VerifierOrganization } from '../../types'

export const createVerifierOrganization = async (
  user_id: string,
  organization_name: string,
  company_pan: string,
  business_type: string,
  registration_number?: string | null,
  address?: string | null,
  contact_email?: string | null,
  contact_phone?: string | null
): Promise<VerifierOrganization> => {
  const result = await pool.query(
    `INSERT INTO verifier_organizations (
      user_id, organization_name, company_pan, business_type, 
      registration_number, address, contact_email, contact_phone
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [user_id, organization_name, company_pan, business_type, registration_number || null, address || null, contact_email || null, contact_phone || null]
  )
  return result.rows[0]
}

export const getVerifierByUserId = async (user_id: string): Promise<VerifierOrganization | null> => {
  const result = await pool.query(
    `SELECT * FROM verifier_organizations WHERE user_id = $1 AND is_active = true`,
    [user_id]
  )
  return result.rows[0] || null
}

export const getVerifierById = async (id: string): Promise<VerifierOrganization | null> => {
  const result = await pool.query(
    `SELECT * FROM verifier_organizations WHERE id = $1 AND is_active = true`,
    [id]
  )
  return result.rows[0] || null
}

export const getVerifierByPAN = async (company_pan: string): Promise<VerifierOrganization | null> => {
  const result = await pool.query(
    `SELECT * FROM verifier_organizations WHERE company_pan = $1 AND is_active = true`,
    [company_pan]
  )
  return result.rows[0] || null
}

export const updateVerifierOrganization = async (
  user_id: string,
  updates: Partial<VerifierOrganization>
): Promise<VerifierOrganization> => {
  const fields = Object.keys(updates)
    .map((key, i) => `${key} = $${i + 1}`)
    .join(', ')
  
  const values = Object.values(updates)
  
  const result = await pool.query(
    `UPDATE verifier_organizations
     SET ${fields}, updated_at = NOW()
     WHERE user_id = $${values.length + 1}
     RETURNING *`,
    [...values, user_id]
  )
  return result.rows[0]
}

export const panExists = async (company_pan: string): Promise<boolean> => {
  const result = await pool.query(
    `SELECT EXISTS(SELECT 1 FROM verifier_organizations WHERE company_pan = $1)`,
    [company_pan]
  )
  return result.rows[0].exists
}
