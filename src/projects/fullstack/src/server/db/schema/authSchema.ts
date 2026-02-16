import {relations} from 'drizzle-orm'
import {index, integer, sqliteTable, text} from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: integer('id', {mode: 'number'}).primaryKey({autoIncrement: true}),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('emailVerified', {mode: 'boolean'})
    .default(false)
    .notNull(),
  image: text('image'),
  createdAt: integer('createdAt', {mode: 'timestamp_ms'}).notNull(),
  updatedAt: integer('updatedAt', {mode: 'timestamp_ms'})
    .$onUpdate(() => new Date())
    .notNull(),
  role: text('role'),
  banned: integer('banned', {mode: 'boolean'}).default(false),
  banReason: text('banReason'),
  banExpires: integer('banExpires', {mode: 'timestamp_ms'}),
  lastName: text('lastName').notNull(),
})

export const sessions = sqliteTable(
  'sessions',
  {
    id: integer('id', {mode: 'number'}).primaryKey({autoIncrement: true}),
    expiresAt: integer('expiresAt', {mode: 'timestamp_ms'}).notNull(),
    token: text('token').notNull().unique(),
    createdAt: integer('createdAt', {mode: 'timestamp_ms'}).notNull(),
    updatedAt: integer('updatedAt', {mode: 'timestamp_ms'})
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text('ipAddress'),
    userAgent: text('userAgent'),
    userId: integer('userId')
      .notNull()
      .references(() => users.id, {onDelete: 'cascade'}),
    impersonatedBy: text('impersonatedBy'),
  },
  table => [index('sessions_userId_idx').on(table.userId)]
)

export const accounts = sqliteTable(
  'accounts',
  {
    id: integer('id', {mode: 'number'}).primaryKey({autoIncrement: true}),
    accountId: text('accountId').notNull(),
    providerId: text('providerId').notNull(),
    userId: integer('userId')
      .notNull()
      .references(() => users.id, {onDelete: 'cascade'}),
    accessToken: text('accessToken'),
    refreshToken: text('refreshToken'),
    idToken: text('idToken'),
    accessTokenExpiresAt: integer('accessTokenExpiresAt', {
      mode: 'timestamp_ms',
    }),
    refreshTokenExpiresAt: integer('refreshTokenExpiresAt', {
      mode: 'timestamp_ms',
    }),
    scope: text('scope'),
    password: text('password'),
    createdAt: integer('createdAt', {mode: 'timestamp_ms'}).notNull(),
    updatedAt: integer('updatedAt', {mode: 'timestamp_ms'})
      .$onUpdate(() => new Date())
      .notNull(),
  },
  table => [index('accounts_userId_idx').on(table.userId)]
)

export const verifications = sqliteTable(
  'verifications',
  {
    id: integer('id', {mode: 'number'}).primaryKey({autoIncrement: true}),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: integer('expiresAt', {mode: 'timestamp_ms'}).notNull(),
    createdAt: integer('createdAt', {mode: 'timestamp_ms'}).notNull(),
    updatedAt: integer('updatedAt', {mode: 'timestamp_ms'})
      .$onUpdate(() => new Date())
      .notNull(),
  },
  table => [index('verifications_identifier_idx').on(table.identifier)]
)

export const passkeys = sqliteTable(
  'passkeys',
  {
    id: integer('id', {mode: 'number'}).primaryKey({autoIncrement: true}),
    name: text('name'),
    publicKey: text('publicKey').notNull(),
    userId: integer('userId')
      .notNull()
      .references(() => users.id, {onDelete: 'cascade'}),
    credentialID: text('credentialID').notNull(),
    counter: integer('counter').notNull(),
    deviceType: text('deviceType').notNull(),
    backedUp: integer('backedUp', {mode: 'boolean'}).notNull(),
    transports: text('transports'),
    createdAt: integer('createdAt', {mode: 'timestamp_ms'}),
    aaguid: text('aaguid'),
  },
  table => [
    index('passkeys_userId_idx').on(table.userId),
    index('passkeys_credentialID_idx').on(table.credentialID),
  ]
)

export const ratelimits = sqliteTable('ratelimits', {
  id: integer('id', {mode: 'number'}).primaryKey({autoIncrement: true}),
  key: text('key').notNull().unique(),
  count: integer('count').notNull(),
  lastRequest: integer('lastRequest').notNull(),
})

export const usersRelations = relations(users, ({many}) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  passkeys: many(passkeys),
}))

export const sessionsRelations = relations(sessions, ({one}) => ({
  users: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}))

export const accountsRelations = relations(accounts, ({one}) => ({
  users: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}))

export const passkeysRelations = relations(passkeys, ({one}) => ({
  users: one(users, {
    fields: [passkeys.userId],
    references: [users.id],
  }),
}))
