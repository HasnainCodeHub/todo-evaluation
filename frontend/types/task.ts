// Frontend type definitions for Phase 2.4
// All types align with backend API contracts

export interface User {
  id: string
  email: string
  name?: string
}

export interface Task {
  id: number
  user_id: string
  title: string
  description?: string
  completed: boolean
  created_at: string
  updated_at: string
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  isLoading: boolean
  error: string | null
}

export interface TaskCreateRequest {
  title: string
  description?: string
}

export interface TaskUpdateRequest {
  title?: string
  description?: string
  completed?: boolean
}

export interface ApiError {
  error: {
    code: string
    message: string
  }
}
