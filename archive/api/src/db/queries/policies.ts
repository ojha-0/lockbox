import pool from '../pool'
import { PermissionPolicy } from '../../types'

export const getPolicyByBusinessType = async (business_type: string): Promise<PermissionPolicy | null> => {
  const result = await pool.query(
    `SELECT * FROM permission_policies WHERE business_type = $1`,
    [business_type]
  )
  
  if (result.rows[0]) {
    return {
      ...result.rows[0],
      allowed_fields: result.rows[0].allowed_fields || [],
    }
  }
  return null
}

export const getAllPolicies = async (): Promise<PermissionPolicy[]> => {
  const result = await pool.query(
    `SELECT * FROM permission_policies ORDER BY business_type ASC`
  )
  
  return result.rows.map(row => ({
    ...row,
    allowed_fields: row.allowed_fields || [],
  }))
}

export const createPolicy = async (
  business_type: string,
  allowed_fields: string[],
  description: string | null = null
): Promise<PermissionPolicy> => {
  const result = await pool.query(
    `INSERT INTO permission_policies (business_type, allowed_fields, description)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [business_type, JSON.stringify(allowed_fields), description]
  )
  
  return {
    ...result.rows[0],
    allowed_fields: result.rows[0].allowed_fields || [],
  }
}

export const updatePolicy = async (
  business_type: string,
  allowed_fields: string[],
  description: string | null = null
): Promise<PermissionPolicy> => {
  const result = await pool.query(
    `UPDATE permission_policies
     SET allowed_fields = $2, description = $3, updated_at = NOW()
     WHERE business_type = $1
     RETURNING *`,
    [business_type, JSON.stringify(allowed_fields), description]
  )
  
  return {
    ...result.rows[0],
    allowed_fields: result.rows[0].allowed_fields || [],
  }
}
