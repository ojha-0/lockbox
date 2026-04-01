import { getPolicyByBusinessType } from '../db/queries/policies'
import { CitizenProfile } from '../types'

export interface FilteredCitizenData {
  full_name?: string
  date_of_birth?: string
  gender?: string
  blood_group?: string
  address?: string
  phone_number?: string
  email?: string
}

export const filterCitizenDataByPolicy = async (
  business_type: string,
  citizen: CitizenProfile & { email?: string }
): Promise<{
  filtered_data: FilteredCitizenData
  allowed_fields: string[]
}> => {
  // Get policy for this business type
  const policy = await getPolicyByBusinessType(business_type)
  
  if (!policy) {
    // Default to minimal fields if no policy found
    return {
      filtered_data: {
        full_name: citizen.full_name,
        date_of_birth: citizen.date_of_birth?.toString(),
      },
      allowed_fields: ['full_name', 'date_of_birth'],
    }
  }

  const allowed_fields = policy.allowed_fields || []
  const filtered_data: FilteredCitizenData = {}

  // Map citizen fields to filter
  const fieldMap: Record<string, keyof CitizenProfile> = {
    full_name: 'full_name',
    date_of_birth: 'date_of_birth',
    gender: 'gender',
    blood_group: 'blood_group',
    address: 'address',
    phone_number: 'phone_number',
  }

  // Include email if allowed
  if (allowed_fields.includes('email') && citizen.email) {
    filtered_data.email = citizen.email
  }

  // Filter based on allowed fields
  for (const field of allowed_fields) {
    const citizenField = fieldMap[field]
    if (citizenField && citizen[citizenField]) {
      const value = citizen[citizenField]
      filtered_data[field as keyof FilteredCitizenData] = 
        field === 'date_of_birth' && value instanceof Date 
          ? value.toISOString().split('T')[0]
          : (value as any)
    }
  }

  return {
    filtered_data,
    allowed_fields,
  }
}

export const determineRiskFlag = (
  biometric_score: number,
  allowed_fields: string[]
): string | null => {
  if (biometric_score < 85) {
    return 'LOW_CONFIDENCE'
  }

  if (biometric_score < 90) {
    return 'MEDIUM_CONFIDENCE'
  }

  // Check for unusual access patterns
  if (allowed_fields.length > 5) {
    return 'EXCESSIVE_DATA_REQUEST'
  }

  return null
}
