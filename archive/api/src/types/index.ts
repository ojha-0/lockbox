import { Request } from 'express'

export interface User {
  id: string
  username: string | null
  national_id: string
  email: string
  password_hash: string
  role: 'citizen' | 'verifier' | 'admin'
  is_active: boolean
  last_login: Date | null
  created_at: Date
  updated_at: Date
}

export interface CitizenProfile {
  id: string
  user_id: string
  full_name: string
  date_of_birth: Date | null
  gender: string | null
  blood_group: string | null
  address: string | null
  phone_number: string | null
  email_verified: boolean
  biometric_enrolled: boolean
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface VerifierOrganization {
  id: string
  user_id: string
  organization_name: string
  company_pan: string
  business_type: 'bank' | 'pharmacy' | 'age_verification' | 'government' | 'telecom'
  registration_number: string | null
  address: string | null
  contact_email: string | null
  contact_phone: string | null
  is_verified: boolean
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface PermissionPolicy {
  id: string
  business_type: string
  allowed_fields: string[]
  description: string | null
  created_at: Date
  updated_at: Date
}

export interface AuditTrail {
  id: string
  citizen_id: string
  verifier_id: string | null
  verifier_org_id: string | null
  action: string
  fields_accessed: string[] | null
  biometric_score: number | null
  result_status: 'APPROVED' | 'BLOCKED' | 'PENDING' | null
  purpose: string | null
  risk_flag: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: Date
}

export interface CitizenDocument {
  id: string
  citizen_id: string
  document_type: string
  file_name: string
  file_type: string
  file_size: number
  storage_url: string | null
  upload_status: 'PENDING' | 'VERIFIED' | 'REJECTED'
  extracted_fields?: string[]
  reviewed_by?: string | null
  review_notes?: string | null
  uploaded_at: Date
  verified_at: Date | null
  created_at: Date
  updated_at: Date
}

export interface CitizenConsent {
  id: string
  citizen_id: string
  business_type: 'bank' | 'pharmacy' | 'age_verification' | 'government' | 'telecom'
  status: 'GRANTED' | 'REVOKED' | 'BLOCKED'
  notes: string | null
  updated_by: string | null
  created_at: Date
  updated_at: Date
}

export interface SuspiciousActivity {
  id: string
  citizen_id: string | null
  verifier_id: string | null
  threat_type: 'brute_force' | 'rate_limit' | 'anomalous_access' | 'replay_attempt' | 'policy_violation'
  description: string | null
  ip_address: string | null
  severity: 'low' | 'medium' | 'high' | 'critical'
  is_resolved: boolean
  admin_notes: string | null
  created_at: Date
  updated_at: Date
}

export interface JWTPayload {
  sub: string // user_id
  national_id: string
  role: 'citizen' | 'verifier' | 'admin'
  business_type?: string
  iat: number
  exp: number
}

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
  meta?: {
    page?: number
    total?: number
    limit?: number
  }
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    national_id: string
    role: 'citizen' | 'verifier' | 'admin'
    business_type?: string
  }
}
