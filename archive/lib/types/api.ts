export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
  meta?: {
    page?: number
    limit?: number
    total?: number
    timestamp?: string
  }
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
}

export interface CitizenData {
  id: string
  user_id: string
  national_id: string
  first_name: string
  last_name: string
  date_of_birth: string
  blood_type: string
  address: string
  phone: string
  biometric_score?: number
}

export interface VerifierData {
  id: string
  user_id: string
  company_pan: string
  organization_name: string
  business_type: string
  email: string
}

export interface AuditEntry {
  id: string
  citizen_id: string
  verifier_id: string | null
  verifier_org_id?: string | null
  organization_name?: string | null
  business_type?: string | null
  action: string
  fields_accessed: string[] | null
  biometric_score: number | null
  result_status: 'APPROVED' | 'BLOCKED' | 'PENDING' | null
  purpose: string | null
  risk_flag: string | null
  created_at: string
}

export interface ConsentItem {
  business_type: 'bank' | 'pharmacy' | 'age_verification' | 'government' | 'telecom'
  allowed_fields: string[]
  description: string | null
  status: 'GRANTED' | 'REVOKED' | 'BLOCKED'
  notes: string | null
  has_required_documents: boolean
  missing_document_fields: string[]
}

export interface AccessOverviewItem {
  business_type: 'bank' | 'pharmacy' | 'age_verification' | 'government' | 'telecom'
  status: 'GRANTED' | 'REVOKED' | 'BLOCKED'
  organization_count: number
  allowed_fields: string[]
  document_ready: boolean
  missing_document_fields: string[]
}

export interface AccessOverview {
  verified_fields: string[]
  items: AccessOverviewItem[]
  supported_document_types: string[]
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
  full_name?: string
  national_id?: string
  citizen_email?: string
  uploaded_at: string
  verified_at: string | null
}

export interface VerificationResult {
  status: 'APPROVED' | 'BLOCKED' | 'PENDING'
  biometric_score: number
  citizen: {
    id: string
    national_id: string
    full_name: string
  }
  allowed_fields: string[]
  filtered_data: Record<string, string>
  missing_document_fields?: string[]
  consent_status?: 'GRANTED' | 'REVOKED' | 'BLOCKED'
  audit_id: string
  timestamp: string
  purpose: string
  risk_flag: string | null
  message?: string
}
