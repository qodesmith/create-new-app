import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { logger } from 'hono/logger'
import { api } from './api'

const app = new Hono()

// Middleware
app.use('*', logger())

// API routes
app.route('/api', api)

// Serve static files in production
app.use('/assets/*', serveStatic({ root: './dist/public' }))

// SPA fallback - serve index.html for all other routes
app.get('*', async (c) => {
  const isDev = process.env.NODE_ENV !== 'production'

  if (isDev) {
    // In development, build and serve index.html on the fly
    const html = await Bun.file('client/index.html').text()
    return c.html(html)
  }

  // In production, serve from dist
  const html = await Bun.file('dist/public/index.html').text()
  return c.html(html)
})

const port = process.env.PORT ?? 3000

console.log(`Server running at http://localhost:${port}`)

export default {
  port,
  fetch: app.fetch,
}
