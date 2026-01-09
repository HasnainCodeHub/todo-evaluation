// Centralized API Client for Phase 2.4
// Handles 401/403 responses appropriately
// Bridge Pattern: Better Auth -> JWT -> FastAPI

import config from '../config'
import type { Task, TaskCreateRequest, TaskUpdateRequest, ApiError } from '../../types/task'

/**
 * ApiClient - Centralized fetch wrapper for backend FastAPI communication.
 *
 * CRITICAL ARCHITECTURE (Bridge Pattern):
 * 1. Frontend uses Better Auth for session management
 * 2. JWT bridge route converts Better Auth session to JWT
 * 3. This client fetches JWT and sends to FastAPI backend
 * 4. Backend validates JWT and processes requests
 *
 * RULES:
 * - NEVER bypass the bridge
 * - NEVER generate JWT client-side
 * - ALWAYS use NEXT_PUBLIC_API_URL for backend
 */
class ApiClient {
  private get baseUrl(): string {
    return config.api.url
  }

  /**
   * Fetch JWT from the bridge route.
   * The bridge validates Better Auth session and returns a signed JWT.
   */
  private async getJWT(): Promise<string> {
    try {
      const response = await fetch('/api/auth/jwt', {
        method: 'GET',
        credentials: 'include', // Send Better Auth cookies to our own API
      })

      if (response.status === 401) {
        throw new Error('SESSION_INVALID')
      }

      if (!response.ok) {
        throw new Error('Failed to obtain authentication token')
      }

      const data = await response.json()
      if (!data.token) {
        throw new Error('No token returned from bridge')
      }

      return data.token
    } catch (error) {
      if (error instanceof Error && error.message === 'SESSION_INVALID') {
        throw error
      }
      console.error('[API Client] JWT bridge error:', error)
      throw new Error('Authentication failed. Please sign in again.')
    }
  }

  private async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const fullUrl = `${this.baseUrl}${url}`

    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] ${options.method || 'GET'} ${fullUrl}`)
    }

    // Step 1: Get JWT from bridge
    let jwt: string
    try {
      jwt = await this.getJWT()
    } catch (error) {
      if (error instanceof Error && error.message === 'SESSION_INVALID') {
        // Session is invalid, frontend should redirect to signin
        throw new Error('SESSION_INVALID')
      }
      throw error
    }

    // Step 2: Call backend with JWT in Authorization header
    let response: Response
    try {
      response = await fetch(fullUrl, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`, // JWT for FastAPI
          ...options.headers,
        },
      })
    } catch (fetchError) {
      console.error(`[API] Network error for ${fullUrl}:`, fetchError)
      throw new Error(`Cannot connect to backend. Please ensure the backend is reachable.`)
    }

    // Handle 401 Unauthorized from BACKEND
    if (response.status === 401) {
      // JWT was rejected by backend (expired or invalid)
      throw new Error('SESSION_INVALID')
    }

    // Handle other errors
    if (!response.ok) {
      try {
        const errorData: ApiError = await response.json()
        throw new Error(errorData.error?.message || `Request failed with status ${response.status}`)
      } catch (e) {
        throw new Error(`Request failed with status ${response.status}`)
      }
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T
    }

    return response.json()
  }

  // Task CRUD operations

  async getTasks(): Promise<Task[]> {
    return this.request<Task[]>('/api/tasks', {
      method: 'GET',
    })
  }

  async getTask(taskId: number): Promise<Task> {
    return this.request<Task>(`/api/tasks/${taskId}`, {
      method: 'GET',
    })
  }

  async createTask(data: TaskCreateRequest): Promise<Task> {
    return this.request<Task>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateTask(taskId: number, data: TaskUpdateRequest): Promise<Task> {
    return this.request<Task>(`/api/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteTask(taskId: number): Promise<void> {
    return this.request<void>(`/api/tasks/${taskId}`, {
      method: 'DELETE',
    })
  }

  async toggleComplete(taskId: number): Promise<Task> {
    return this.request<Task>(`/api/tasks/${taskId}/complete`, {
      method: 'PATCH',
    })
  }
}

export const apiClient = new ApiClient()
