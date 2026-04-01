import pool from '../pool'
import { CitizenProfile } from '../../types'

let citizenSchemaReady = false

const ensureCitizenSchema = async (): Promise<void> => {
  if (citizenSchemaReady) return
  await pool.query(`ALTER TABLE citizen_profiles ALTER COLUMN date_of_birth DROP NOT NULL`)
  citizenSchemaReady = true
}

export const createCitizenProfile = async (
  user_id: string,
  full_name: string,
  date_of_birth: Date | null,
  gender: string | null = null,
  blood_group: string | null = null,
  address: string | null = null,
  phone_number: string | null = null
): Promise<CitizenProfile> => {
  await ensureCitizenSchema()
  const result = await pool.query(
    `INSERT INTO citizen_profiles (user_id, full_name, date_of_birth, gender, blood_group, address, phone_number)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [user_id, full_name, date_of_birth, gender, blood_group, address, phone_number]
  )
  return result.rows[0]
}

export const getCitizenProfileByUserId = async (user_id: string): Promise<CitizenProfile | null> => {
  const result = await pool.query(
    `SELECT * FROM citizen_profiles WHERE user_id = $1 AND is_active = true`,
    [user_id]
  )
  return result.rows[0] || null
}

export const getCitizenProfileById = async (id: string): Promise<CitizenProfile | null> => {
  const result = await pool.query(
    `SELECT * FROM citizen_profiles WHERE id = $1 AND is_active = true`,
    [id]
  )
  return result.rows[0] || null
}

export const updateCitizenProfile = async (
  user_id: string,
  updates: Partial<CitizenProfile>
): Promise<CitizenProfile> => {
  const fields = Object.keys(updates)
    .map((key, i) => `${key} = $${i + 1}`)
    .join(', ')
  
  const values = Object.values(updates)
  
  const result = await pool.query(
    `UPDATE citizen_profiles 
     SET ${fields}, updated_at = NOW()
     WHERE user_id = $${values.length + 1}
     RETURNING *`,
    [...values, user_id]
  )
  return result.rows[0]
}

export const getCitizenByNationalId = async (national_id: string): Promise<(CitizenProfile & { user_id: string }) | null> => {
  const result = await pool.query(
    `SELECT cp.*, u.id as user_id
     FROM citizen_profiles cp
     JOIN users u ON cp.user_id = u.id
     WHERE u.national_id = $1 AND cp.is_active = true`,
    [national_id]
  )
  return result.rows[0] || null
}

export const phoneNumberExists = async (phone_number: string): Promise<boolean> => {
  const result = await pool.query(
    `SELECT EXISTS(SELECT 1 FROM citizen_profiles WHERE phone_number = $1)`,
    [phone_number]
  )
  return result.rows[0].exists
}
