// Centralized API Client for Phase 2.4
// All API requests include JWT token in Authorization header
// Handles 401/403 responses appropriately

import config from '../config'
import type { Task, TaskCreateRequest, TaskUpdateRequest, ApiError } from '../../types/task'

/**
 * ApiClient - Centralized fetch wrapper for backend FastAPI communication.
 *
 * CRITICAL (ARCHITECT RULES):
 * 1. Exchanges Better Auth session for a JWT token via /api/auth/jwt BEFORE backend calls.
 * 2. Attaches token as Authorization: Bearer <token>.
 * 3. NEVER uses /api/auth/jwt response to decide UI routing.
 */
class ApiClient {
  private get baseUrl(): string {
    return config.api.url
  }

  /**
   * getJwt - Exchanges the Better Auth session cookie for a short-lived JWT token.
   * This is called before every backend request to ensure we have a fresh token.
   */
  private async getJwt(): Promise<string | null> {
    try {
      const response = await fetch('/api/auth/jwt', {
        credentials: 'include', // Send Better Auth session cookies
      })

      if (!response.ok) {
        // 401 here is EXPECTED when unauthenticated and must NOT trigger redirects.
        return null
      }

      const data = await response.json()
      return data.token || null
    } catch (err) {
      console.error('[API] JWT exchange failed:', err)
      return null
    }
  }

  private async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Phase 4 Rule: First fetch /api/auth/jwt
    const token = await this.getJwt()

    if (!token) {
      // If we can't get a token, the backend will return 401 anyway.
      // We don't trigger redirects here; we let the UI AuthGuard handle state.
      throw new Error('Unauthorized: No valid session token available')
    }

    const fullUrl = `${this.baseUrl}${url}`

    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] ${options.method || 'GET'} ${fullUrl}`)
    }

    let response: Response
    try {
      response = await fetch(fullUrl, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      })
    } catch (fetchError) {
      console.error(`[API] Network error for ${fullUrl}:`, fetchError)
      throw new Error(`Cannot connect to backend. Please ensure the backend is reachable.`)
    }

    // Handle 401 Unauthorized from BACKEND
    if (response.status === 401) {
      // Token might be expired or invalid on backend
      throw new Error('Session expired or unauthorized. Please sign in again.')
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
