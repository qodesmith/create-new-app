// Shared types between client and server

export interface ApiResponse<T> {
  data?: T
  error?: string
}

export interface HealthResponse {
  status: 'ok' | 'error'
  timestamp: string
}
