// Mock API client for development when backend is not running
export const mockLogin = (type: 'citizen' | 'verifier', id: string, password: string) => {
  if (password.length < 4) {
    return {
      success: false,
      error: 'Invalid password',
    }
  }

  const mockToken = `mock_token_${Date.now()}`
  const mockRefreshToken = `mock_refresh_${Date.now()}`

  if (type === 'citizen') {
    return {
      success: true,
      data: {
        access_token: mockToken,
        refresh_token: mockRefreshToken,
        citizen: {
          id: `citizen_${id}`,
          user_id: `user_${id}`,
          national_id: id,
          first_name: 'Demo',
          last_name: 'Citizen',
          date_of_birth: '1990-01-01',
          blood_type: 'O+',
          address: 'Demo Address, Kathmandu',
          phone: '+977-1-1234567',
        },
      },
    }
  } else {
    return {
      success: true,
      data: {
        access_token: mockToken,
        refresh_token: mockRefreshToken,
        verifier: {
          id: `verifier_${id}`,
          user_id: `user_${id}`,
          company_pan: id,
          organization_name: 'Demo Organization',
          business_type: 'Finance',
          email: 'demo@org.com',
        },
      },
    }
  }
}

export const mockRegister = (type: 'citizen' | 'verifier', data: any) => {
  const mockToken = `mock_token_${Date.now()}`
  const mockRefreshToken = `mock_refresh_${Date.now()}`

  return {
    success: true,
    data: {
      access_token: mockToken,
      refresh_token: mockRefreshToken,
      [type]: {
        id: `${type}_${Date.now()}`,
        user_id: `user_${Date.now()}`,
        ...data,
      },
    },
  }
}
