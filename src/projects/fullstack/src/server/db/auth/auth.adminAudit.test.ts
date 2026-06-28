import type {AuthSchemaInsert} from '@/server/types'
import type {UserRole} from '@/shared/types'

import {Database} from 'bun:sqlite'
import {beforeAll, beforeEach, describe, expect, it, mock} from 'bun:test'
import path from 'node:path'
import process from 'node:process'

import {authOptions, drizzleAdapterOptions} from '@/server/db/auth/authOptions'
import * as appSchema from '@/server/db/schema/appSchema'
import * as authSchema from '@/server/db/schema/authSchema'

import {drizzleAdapter} from '@better-auth/drizzle-adapter'
import {betterAuth} from 'better-auth'
import {sql} from 'drizzle-orm'
import {drizzle} from 'drizzle-orm/bun-sqlite'
import {migrate} from 'drizzle-orm/bun-sqlite/migrator'

/*
  Integration tests for the `after` hook (in authOptions.ts) that audits admin
  user-management mutations into `adminAuditLogsTable`.

  Infra approach (mirrors adminRoutes.test.ts)
  --------------------------------------------
  - DB: a real in-memory `bun:sqlite` db wired through drizzle with the same
    `casing: 'camelCase'` + combined schema the production singleton uses, with
    tables created by the actual drizzle MIGRATIONS.
  - getDatabase: `mock.module(...)` returns the seeded in-memory db. The `after`
    hook calls `getDatabase()` at request time, so this routes its audit writes
    into our in-memory db.
  - auth: rather than import the production `auth` singleton (adminRoutes.test.ts
    globally mocks that module to stub `getSession`, and Bun's module mocks leak
    across files in one run), we build our OWN better-auth instance from the
    shared `authOptions` against the seeded db — the same pattern
    `authSchemaGenerator.ts` uses. This runs the REAL hook while staying immune
    to the other file's mock. Admin actions are driven through `auth.api.*` with
    a real signed-in session, which is the only layer the hook fires on.
*/

// Stable secret so cookie signing/verification is consistent within the run.
process.env.BETTER_AUTH_SECRET ??= 'test-better-auth-secret-0123456789abcdef'

const schema = {...appSchema, ...authSchema}

const client = new Database(':memory:')
const testDb = drizzle({client, schema, casing: 'camelCase'})
testDb.run(sql`PRAGMA foreign_keys = ON;`)

migrate(testDb, {
  migrationsFolder: path.resolve(import.meta.dirname, '../drizzle'),
})

mock.module('@/server/db/getDatabase', () => ({
  getDatabase: () => testDb,
  exportDatabase: () => {
    throw new Error('exportDatabase not used in these tests')
  },
}))

// Our own instance of the real config, wired to the seeded in-memory db.
const auth = betterAuth({
  ...authOptions,
  database: drizzleAdapter(testDb, drizzleAdapterOptions),
})

const password = 'Password123!'
const adminId = 'admin-1'
const adminEmail = 'ada@example.com'
// Distinct target per scenario so test order / bans don't interfere.
const banTargetId = 'user-ban'
const roleTargetId = 'user-role'
const impersonateTargetId = 'user-impersonate'

type User = AuthSchemaInsert['users']
type Account = AuthSchemaInsert['accounts']

function makeUser(id: string, email: string, role: UserRole): User {
  const now = new Date()
  return {
    id,
    name: 'Test',
    lastName: 'User',
    email,
    emailVerified: true,
    role,
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Flatten a response's Set-Cookie headers into a single `Cookie` request header
 * (`name=value; name2=value2`), to carry the session forward into the next
 * `auth.api.*` call. Dedupes by cookie name keeping the last value and dropping
 * cleared (empty-value) cookies — impersonation, for instance, emits an empty
 * `session_token` to clear it followed by the real impersonation token, and a
 * naive join would let the empty one win.
 */
function cookieHeader(res: Response): string {
  const jar = new Map<string, string>()

  for (const raw of res.headers.getSetCookie()) {
    const pair = raw.split(';')[0]
    if (!pair) continue

    const eq = pair.indexOf('=')
    if (eq === -1) continue

    const name = pair.slice(0, eq)
    const value = pair.slice(eq + 1)

    if (value === '') {
      jar.delete(name)
    } else {
      jar.set(name, value)
    }
  }

  return Array.from(jar, ([name, value]) => `${name}=${value}`).join('; ')
}

function auditRows(action?: string) {
  const rows = testDb.select().from(appSchema.adminAuditLogsTable).all()
  return action ? rows.filter(r => r.metadata.action === action) : rows
}

// Assert exactly one row for an action and return it (narrowed to defined).
function expectSingleRow(action: string) {
  const rows = auditRows(action)
  expect(rows).toHaveLength(1)

  const row = rows[0]
  if (!row) throw new Error(`expected exactly one '${action}' audit row`)

  return row
}

// The acting admin's signed-in session, captured once in beforeAll.
let adminCookie: string

beforeAll(async () => {
  const hash = await Bun.password.hash(password, 'argon2id')
  const now = new Date()

  const users: User[] = [
    makeUser(adminId, adminEmail, 'admin'),
    makeUser(banTargetId, 'ban@example.com', 'user'),
    makeUser(roleTargetId, 'role@example.com', 'user'),
    makeUser(impersonateTargetId, 'impersonate@example.com', 'user'),
  ]
  testDb.insert(authSchema.users).values(users).run()

  // Credential account so the admin can sign in (password hashed with the same
  // Bun argon2id config auth.ts verifies against).
  const adminAccount: Account = {
    id: 'account-admin',
    accountId: adminId,
    providerId: 'credential',
    userId: adminId,
    password: hash,
    createdAt: now,
    updatedAt: now,
  }
  testDb.insert(authSchema.accounts).values(adminAccount).run()

  const signInRes = await auth.api.signInEmail({
    body: {email: adminEmail, password},
    asResponse: true,
  })
  expect(signInRes.status).toBe(200)
  adminCookie = cookieHeader(signInRes)
  expect(adminCookie.length).toBeGreaterThan(0)
})

// Each test starts from an empty audit table so row assertions are exact.
beforeEach(() => {
  testDb.delete(appSchema.adminAuditLogsTable).run()
})

function adminHeaders() {
  return new Headers({cookie: adminCookie})
}

describe('admin user-management audit hook', () => {
  it('records a row for a successful ban-user with the expected metadata', async () => {
    await auth.api.banUser({
      body: {userId: banTargetId, banReason: 'spam', banExpiresIn: 3600},
      headers: adminHeaders(),
    })

    const row = expectSingleRow('ban-user')
    expect(row.userId).toBe(adminId)
    expect(row.metadata).toMatchObject({
      action: 'ban-user',
      targetUserId: banTargetId,
      banReason: 'spam',
      banExpiresIn: 3600,
    })
  })

  it('records a row for a successful set-user-role capturing the new role', async () => {
    await auth.api.setRole({
      body: {userId: roleTargetId, role: 'admin'},
      headers: adminHeaders(),
    })

    const row = expectSingleRow('set-user-role')
    expect(row.userId).toBe(adminId)
    expect(row.metadata).toMatchObject({
      action: 'set-user-role',
      targetUserId: roleTargetId,
      role: 'admin',
    })
  })

  it('writes nothing when the underlying action fails', async () => {
    // Banning yourself is rejected by the admin plugin with an APIError, so the
    // hook must see `ctx.context.returned instanceof APIError` and skip.
    await expect(
      auth.api.banUser({
        body: {userId: adminId},
        headers: adminHeaders(),
      })
    ).rejects.toThrow()

    expect(auditRows()).toHaveLength(0)
  })

  it('attributes impersonation actions to the real admin, not the impersonated user', async () => {
    const impRes = await auth.api.impersonateUser({
      body: {userId: impersonateTargetId},
      headers: adminHeaders(),
      asResponse: true,
    })
    expect(impRes.status).toBe(200)

    const impRow = expectSingleRow('impersonate-user')
    expect(impRow.userId).toBe(adminId)
    expect(impRow.metadata).toMatchObject({
      action: 'impersonate-user',
      targetUserId: impersonateTargetId,
    })

    // Continue with the impersonation session cookies. During impersonation the
    // session's user is the impersonated user, so the hook must resolve the real
    // admin via `session.impersonatedBy`.
    const stopRes = await auth.api.stopImpersonating({
      headers: new Headers({cookie: cookieHeader(impRes)}),
      asResponse: true,
    })
    expect(stopRes.status).toBe(200)

    const stopRow = expectSingleRow('stop-impersonating')
    expect(stopRow.userId).toBe(adminId)
    expect(stopRow.metadata).toMatchObject({
      action: 'stop-impersonating',
      targetUserId: impersonateTargetId,
    })
  })
})
