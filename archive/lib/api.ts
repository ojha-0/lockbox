import { APIResponse } from '@/lib/types/api'
import { mockLogin, mockRegister } from '@/lib/api-mock'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'
const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true'

export class APIClient {
  private accessToken: string | null = null

  setAccessToken(token: string | null) {
    this.accessToken = token
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit & { requireAuth?: boolean } = {}
  ): Promise<APIResponse<T>> {
    // Use mock API for citizen/verifier login during development
    if (USE_MOCK_API && (endpoint.includes('/auth/citizen/login') || endpoint.includes('/auth/verifier/login'))) {
      const body = options.body ? JSON.parse(options.body as string) : {}
      const type = endpoint.includes('/citizen') ? 'citizen' : 'verifier'
      const id = type === 'citizen' ? body.identifier || body.national_id : body.company_pan
      return mockLogin(type, id, body.password) as any
    }

    if (USE_MOCK_API && (endpoint.includes('/auth/citizen/register') || endpoint.includes('/auth/verifier/register'))) {
      const body = options.body ? JSON.parse(options.body as string) : {}
      const type = endpoint.includes('/citizen') ? 'citizen' : 'verifier'
      return mockRegister(type, body) as any
    }

    const url = `${API_URL}${endpoint}`
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (options.requireAuth !== false && this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      const data: APIResponse<T> = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      return data
    } catch (error: any) {
      console.error('[API Error]', endpoint, error.message)
      const isConnectionError =
        error.message?.includes('Failed to fetch') ||
        error.message?.includes('NetworkError') ||
        error.message?.includes('ERR_NETWORK')

      return {
        success: false,
        error: isConnectionError
          ? 'Unable to connect to server. Please start API on port 5000 and try again.'
          : error.message,
        code: 'ERR_NETWORK',
      }
    }
  }

  async get<T = any>(endpoint: string, options?: RequestInit & { requireAuth?: boolean }): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  async post<T = any>(
    endpoint: string,
    body?: any,
    options?: RequestInit & { requireAuth?: boolean }
  ): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async put<T = any>(
    endpoint: string,
    body?: any,
    options?: RequestInit & { requireAuth?: boolean }
  ): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async delete<T = any>(endpoint: string, options?: RequestInit & { requireAuth?: boolean }): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }

  async patch<T = any>(
    endpoint: string,
    body?: any,
    options?: RequestInit & { requireAuth?: boolean }
  ): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    })
  }
}

export const apiClient = new APIClient()
