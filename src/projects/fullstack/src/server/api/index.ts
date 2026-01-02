import { Hono } from 'hono'
import { cors } from 'hono/cors'

export const api = new Hono()

// Enable CORS for API routes
api.use('*', cors())

// Health check
api.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Example API route
api.get('/hello', (c) => {
  return c.json({ message: 'Hello from {{PROJECT_NAME}}!' })
})
