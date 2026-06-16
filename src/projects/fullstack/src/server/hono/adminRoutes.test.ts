import type {InferResponseType} from 'hono/client'
import type {
  AppSchemaInsert,
  AuthSchemaInsert,
  HonoAdminServer,
} from '@/server/types'

import {Database} from 'bun:sqlite'
import {beforeAll, describe, expect, it, mock} from 'bun:test'
import path from 'node:path'

import * as appSchema from '@/server/db/schema/appSchema'
import * as authSchema from '@/server/db/schema/authSchema'

import {sql} from 'drizzle-orm'
import {drizzle} from 'drizzle-orm/bun-sqlite'
import {migrate} from 'drizzle-orm/bun-sqlite/migrator'
import {hc} from 'hono/client'

// Only used to infer types.
const _adminClient = hc<HonoAdminServer>('')

type AdminRoutes = typeof _adminClient
type User = AuthSchemaInsert['users']
type AdminAuditLog = AppSchemaInsert['adminAuditLogsTable']
type SystemAuditLog = AppSchemaInsert['systemAuditLogsTable']
type ErrorRecord = AppSchemaInsert['errorsTable']
type ErrorsResponse = InferResponseType<AdminRoutes['errors']['$get']>
type AdminAuditLogsResponse = InferResponseType<
  AdminRoutes['admin-audit-logs']['$get']
>
type SystemAuditLogsResponse = InferResponseType<
  AdminRoutes['system-audit-logs']['$get']
>

/*
  FIRST integration tests in this repo. Driven by Bun's built-in runner.
  Run with: `bun test src/server/hono/adminRoutes.test.ts`.

  Infra approach
  --------------
  - DB: a real in-memory `bun:sqlite` database wired through drizzle with the
    same `casing: 'camelCase'` + combined schema the production singleton uses.
    Tables are created by running the actual drizzle MIGRATIONS (the
    `src/server/db/drizzle` folder) via drizzle's `migrate(...)` — NOT raw SQL.
  - getDatabase: `mock.module('@/server/db/getDatabase', ...)` returns the
    seeded in-memory db. This MUST be registered before `adminRoutes` is
    imported (ESM imports hoist), so the router is loaded via a dynamic
    `await import(...)` AFTER the mocks are in place.
  - session/auth: `adminMiddleware` -> `authMiddleware` calls
    `auth.api.getSession({headers})`. We `mock.module('@/server/db/auth/auth')`
    to stub `getSession`, returning the current `mockSessionUser` (toggleable so
    a non-admin / no-session request can be exercised for the 403/401 paths).
    Mocking this module also sidesteps better-auth calling `getDatabase()` at
    its own module-load time.
*/

const schema = {...appSchema, ...authSchema}

// In-memory drizzle db mirroring the production getDatabase() construction.
const client = new Database(':memory:')
const testDb = drizzle({client, schema, casing: 'camelCase'})
testDb.run(sql`PRAGMA foreign_keys = ON;`)

/**
 * Run the real migrations so the schema matches production exactly. This is
 * safe because we're running migrations against an in-memory database, so no
 * side effects are produced.
 */
migrate(testDb, {
  migrationsFolder: path.resolve(import.meta.dirname, '../db/drizzle'),
})

/**
 * Toggleable session. authMiddleware returns 401 when this is null, and
 * adminMiddleware returns 403 when the user isn't an admin.
 */
const adminUser: User = {
  id: 'admin-1',
  name: 'Ada',
  lastName: 'Admin',
  email: 'ada@example.com',
  emailVerified: true,
  role: 'admin',
  image: null,
  banned: false,
  banReason: null,
  banExpires: null,
  createdAt: new Date(),
}
const regularUser: User = {
  id: 'user-2',
  name: 'Reggie',
  lastName: 'Regular',
  email: 'reggie@example.com',
  emailVerified: true,
  role: 'user',
  image: null,
  banned: false,
  banReason: null,
  banExpires: null,
  createdAt: new Date(),
}

let mockSessionUser: User | null = adminUser

mock.module('@/server/db/getDatabase', () => ({
  getDatabase: () => testDb,
  exportDatabase: () => {
    throw new Error('exportDatabase not used in these tests')
  },
}))

mock.module('@/server/db/auth/auth', () => ({
  auth: {
    api: {
      getSession: async () => {
        if (!mockSessionUser) return null
        return {
          user: mockSessionUser,
          session: {
            id: 'session-1',
            userId: mockSessionUser.id,
            token: 'token-1',
            expiresAt: new Date(Date.now() + 60_000),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        }
      },
    },
  },
}))

// Loaded after the mocks above are registered (dynamic import, no hoisting).
let adminRoutes: HonoAdminServer

// Fixed, distinct timestamps so sort order is deterministic.
const year = new Date().getFullYear()
const month = new Date().getMonth()
const t1 = new Date(year, month, 1) // oldest
const t2 = new Date(year, month, 2)
const t3 = new Date(year, month, 3) // newest

const avatarBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x01, 0x02, 0x03])
const avatarCreatedAt = new Date(year, month + 1, 1)

beforeAll(async () => {
  // Seed users.
  testDb
    .insert(authSchema.users)
    .values([
      {
        id: adminUser.id,
        name: adminUser.name,
        lastName: adminUser.lastName,
        email: adminUser.email,
        emailVerified: true,
        role: 'admin',
        createdAt: t1,
      },
      {
        id: regularUser.id,
        name: regularUser.name,
        lastName: regularUser.lastName,
        email: regularUser.email,
        emailVerified: true,
        role: 'user',
        createdAt: t1,
      },
    ])
    .run()

  // Seed admin audit logs with varied actions + timestamps.
  const adminLogs: AdminAuditLog[] = [
    {
      userId: adminUser.id,
      metadata: {action: 'download-database', status: 'complete'},
      createdAt: t1,
    },
    {
      userId: adminUser.id,
      metadata: {action: 'purge-stale-users', deletedCount: 3},
      createdAt: t2,
    },
    {
      userId: adminUser.id,
      metadata: {action: 'download-database', status: 'fail'},
      createdAt: t3,
    },
  ]

  for (const row of adminLogs) {
    testDb.insert(appSchema.adminAuditLogsTable).values(row).run()
  }

  // Seed system audit logs (no userId).
  const systemLogs: SystemAuditLog[] = [
    {
      metadata: {action: 'purge-stale-users', deletedCount: 1},
      createdAt: t1,
    },
    {
      metadata: {action: 'purge-expired-verifications', deletedCount: 2},
      createdAt: t2,
    },
    {
      metadata: {action: 'purge-stale-users', deletedCount: 5},
      createdAt: t3,
    },
  ]
  for (const row of systemLogs) {
    testDb.insert(appSchema.systemAuditLogsTable).values(row).run()
  }

  // Seed errors: mixed client/server contexts, some with a user, some without.
  const errorRecords: ErrorRecord[] = [
    {
      error: {message: 'client boom', name: 'Error'},
      context: 'client:signIn:exception',
      userId: regularUser.id,
      createdAt: t1,
    },
    {
      error: {message: 'server boom'},
      context: 'hono:topLevel:exception',
      userId: null,
      metadata: {route: '/api/whatever'},
      createdAt: t2,
    },
    {
      error: {name: 'TypeError'},
      context: 'client:topLevel:exception',
      userId: adminUser.id,
      createdAt: t3,
    },
  ]
  for (const row of errorRecords) {
    testDb.insert(appSchema.errorsTable).values(row).run()
  }

  // One avatar for the admin user.
  testDb
    .insert(appSchema.avatarsTable)
    .values({
      userId: adminUser.id,
      data: avatarBytes,
      mimeType: 'image/png',
      createdAt: avatarCreatedAt,
      updatedAt: avatarCreatedAt,
    })
    .run()

  const mod = await import('@/server/hono/adminRoutes')
  adminRoutes = mod.adminRoutes
})

// Default to an admin session before each behavioral test.
function asAdmin() {
  mockSessionUser = adminUser
}

describe('GET /admin-audit-logs', () => {
  it('returns rows with joined user fields and correct total', async () => {
    asAdmin()
    const res = await adminRoutes.request('/admin-audit-logs')
    expect(res.status).toBe(200)

    const body = (await res.json()) as AdminAuditLogsResponse
    expect(body.total).toBe(3)
    expect(body.logs).toHaveLength(3)

    for (const row of body.logs) {
      expect(row).toHaveProperty('id')
      expect(row).toHaveProperty('createdAt')
      expect(row).toHaveProperty('metadata')
      expect(row.user).toMatchObject({
        id: adminUser.id,
        name: adminUser.name,
        lastName: adminUser.lastName,
        email: adminUser.email,
      })
    }
  })

  it('defaults to createdAt desc (newest first)', async () => {
    asAdmin()
    const res = await adminRoutes.request('/admin-audit-logs')
    const {logs} = (await res.json()) as AdminAuditLogsResponse
    const createdAts = logs.map(l => new Date(l.createdAt).getTime())

    expect(createdAts).toEqual([t3.getTime(), t2.getTime(), t1.getTime()])
  })

  it('sorts by createdAt asc (oldest first)', async () => {
    asAdmin()
    const res = await adminRoutes.request('/admin-audit-logs?sortDirection=asc')
    const {logs} = (await res.json()) as AdminAuditLogsResponse
    const createdAts = logs.map(l => new Date(l.createdAt).getTime())

    expect(createdAts).toEqual([t1.getTime(), t2.getTime(), t3.getTime()])
  })

  it('sorts by the JSON action field', async () => {
    asAdmin()
    const res = await adminRoutes.request(
      '/admin-audit-logs?sortBy=action&sortDirection=asc'
    )
    const {logs} = (await res.json()) as AdminAuditLogsResponse
    const actions = logs.map(l => l.metadata.action)

    // 'download-database' (x2) sorts before 'purge-stale-users' alphabetically.
    expect(actions).toEqual([
      'download-database',
      'download-database',
      'purge-stale-users',
    ])
  })

  it('paginates: page/pageSize limits the slice, total unchanged', async () => {
    asAdmin()
    const res = await adminRoutes.request(
      '/admin-audit-logs?page=1&pageSize=10&sortDirection=asc'
    )
    const body = (await res.json()) as AdminAuditLogsResponse
    expect(body.total).toBe(3)

    // pageSize is constrained to '10' | '25' | '50', so simulate paging by
    // requesting page 2 with the smallest size against 3 rows... but smallest
    // is 10. Instead assert pageSize caps the returned slice using a small set:
    // request page 1 returns all 3 (under the cap), page 2 returns none.
    const page2 = await adminRoutes.request(
      '/admin-audit-logs?page=2&pageSize=10'
    )
    const page2Body = (await page2.json()) as AdminAuditLogsResponse
    expect(page2Body.total).toBe(3)
    expect(page2Body.logs).toHaveLength(0)
  })

  it('filters by action, narrowing results (total reflects filter)', async () => {
    asAdmin()
    const res = await adminRoutes.request(
      '/admin-audit-logs?action=download-database'
    )
    const body = (await res.json()) as AdminAuditLogsResponse
    expect(body.total).toBe(2)
    expect(body.logs).toHaveLength(2)

    for (const row of body.logs) {
      expect(row.metadata.action).toBe('download-database')
    }
  })
})

describe('GET /system-audit-logs', () => {
  it('returns rows + total and rows have NO user field', async () => {
    asAdmin()
    const res = await adminRoutes.request('/system-audit-logs')
    expect(res.status).toBe(200)

    const body = (await res.json()) as SystemAuditLogsResponse
    expect(body.total).toBe(3)
    expect(body.logs).toHaveLength(3)

    for (const row of body.logs) {
      expect(row).toHaveProperty('id')
      expect(row).toHaveProperty('createdAt')
      expect(row).toHaveProperty('metadata')
      expect(row).not.toHaveProperty('user')
    }
  })

  it('paginates with total unchanged', async () => {
    asAdmin()
    const res = await adminRoutes.request(
      '/system-audit-logs?page=2&pageSize=10'
    )
    const body = (await res.json()) as SystemAuditLogsResponse
    expect(body.total).toBe(3)
    expect(body.logs).toHaveLength(0)
  })

  it('filters by action', async () => {
    asAdmin()
    const res = await adminRoutes.request(
      '/system-audit-logs?action=purge-stale-users'
    )
    const body = (await res.json()) as SystemAuditLogsResponse
    expect(body.total).toBe(2)
    expect(body.logs).toHaveLength(2)

    for (const row of body.logs) {
      expect(row.metadata.action).toBe('purge-stale-users')
    }
  })
})

describe('GET /errors', () => {
  it('returns rows + total, newest-first, with joined user (null when none)', async () => {
    asAdmin()
    const res = await adminRoutes.request('/errors')
    expect(res.status).toBe(200)

    const body = (await res.json()) as ErrorsResponse
    expect(body.total).toBe(3)
    expect(body.errors).toHaveLength(3)

    // Default sort is createdAt desc: t3 (client:topLevel), t2 (hono), t1 (client:signIn).
    expect(body.errors.map(e => e.context)).toEqual([
      'client:topLevel:exception',
      'hono:topLevel:exception',
      'client:signIn:exception',
    ])

    // The client:topLevel row is attributed to the admin; the hono row (no
    // userId) joins to null.
    const adminRow = body.errors.find(
      e => e.context === 'client:topLevel:exception'
    )
    const systemRow = body.errors.find(
      e => e.context === 'hono:topLevel:exception'
    )
    expect(adminRow?.user).toMatchObject({
      id: adminUser.id,
      name: adminUser.name,
      lastName: adminUser.lastName,
      email: adminUser.email,
    })
    expect(systemRow?.user).toBeNull()

    for (const row of body.errors) {
      expect(row).toHaveProperty('id')
      expect(row).toHaveProperty('createdAt')
      expect(row).toHaveProperty('error')
    }
  })

  it('sorts by createdAt asc (oldest first)', async () => {
    asAdmin()
    const res = await adminRoutes.request('/errors?sortDirection=asc')
    const {errors} = (await res.json()) as ErrorsResponse
    const createdAts = errors.map(e => new Date(e.createdAt).getTime())

    expect(createdAts).toEqual([t1.getTime(), t2.getTime(), t3.getTime()])
  })

  it('sorts by context', async () => {
    asAdmin()
    const res = await adminRoutes.request(
      '/errors?sortBy=context&sortDirection=asc'
    )
    const {errors} = (await res.json()) as ErrorsResponse

    expect(errors.map(e => e.context)).toEqual([
      'client:signIn:exception',
      'client:topLevel:exception',
      'hono:topLevel:exception',
    ])
  })

  it('filters by category=client', async () => {
    asAdmin()
    const res = await adminRoutes.request('/errors?category=client')
    const body = (await res.json()) as ErrorsResponse

    expect(body.total).toBe(2)
    expect(body.errors).toHaveLength(2)
    for (const row of body.errors) {
      expect(row.context.startsWith('client:')).toBe(true)
    }
  })

  it('filters by category=server (negation of client:%)', async () => {
    asAdmin()
    const res = await adminRoutes.request('/errors?category=server')
    const body = (await res.json()) as ErrorsResponse

    expect(body.total).toBe(1)
    expect(body.errors[0]?.context).toBe('hono:topLevel:exception')
  })

  it('filters by exact context', async () => {
    asAdmin()
    const res = await adminRoutes.request(
      '/errors?context=client:signIn:exception'
    )
    const body = (await res.json()) as ErrorsResponse

    expect(body.total).toBe(1)
    expect(body.errors[0]?.context).toBe('client:signIn:exception')
  })

  it('paginates with total unchanged', async () => {
    asAdmin()
    const res = await adminRoutes.request('/errors?page=2&pageSize=10')
    const body = (await res.json()) as ErrorsResponse

    expect(body.total).toBe(3)
    expect(body.errors).toHaveLength(0)
  })

  it('returns 403 for a non-admin and 401 for no session', async () => {
    mockSessionUser = regularUser
    expect((await adminRoutes.request('/errors')).status).toBe(403)

    mockSessionUser = null
    expect((await adminRoutes.request('/errors')).status).toBe(401)

    asAdmin()
  })
})

describe('GET /avatar/:userId', () => {
  it('returns 200 with bytes and correct Content-Type for a user with an avatar', async () => {
    asAdmin()
    const res = await adminRoutes.request(`/avatar/${adminUser.id}`)
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('image/png')
    expect(res.headers.get('Cache-Control')).toBe('private, no-cache')

    const bytes = new Uint8Array(await res.arrayBuffer())
    expect(bytes).toEqual(new Uint8Array(avatarBytes))
  })

  it('sets a weak ETag derived from updatedAt and returns 304 on matching If-None-Match', async () => {
    asAdmin()
    const first = await adminRoutes.request(`/avatar/${adminUser.id}`)
    const etag = first.headers.get('ETag')
    expect(etag).toBe(`W/"${avatarCreatedAt.getTime()}"`)

    const second = await adminRoutes.request(`/avatar/${adminUser.id}`, {
      headers: {'If-None-Match': etag as string},
    })
    expect(second.status).toBe(304)
    expect(second.headers.get('Cache-Control')).toBe('private, no-cache')
  })

  it('returns 404 for a user without an avatar', async () => {
    asAdmin()
    const res = await adminRoutes.request(`/avatar/${regularUser.id}`)
    expect(res.status).toBe(404)
  })
})

describe('authorization', () => {
  it('returns 403 for a non-admin session', async () => {
    mockSessionUser = regularUser
    const res = await adminRoutes.request('/admin-audit-logs')
    expect(res.status).toBe(403)
    asAdmin()
  })

  it('returns 401 for no session', async () => {
    mockSessionUser = null
    const res = await adminRoutes.request('/admin-audit-logs')
    expect(res.status).toBe(401)
    asAdmin()
  })
})
