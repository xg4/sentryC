import { index, pgTable, real, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const ipAddresses = pgTable(
  'ip_addresses',
  {
    id: serial().primaryKey(),
    ip: text().notNull().unique(),
    cidr: text(),
    description: text(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  t => [index().on(t.ip, t.createdAt)],
)

export const pingResults = pgTable(
  'ping_results',
  {
    id: serial().primaryKey(),
    ipAddress: text('ip_address')
      .notNull()
      .references(() => ipAddresses.ip),
    latency: real(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  t => [index().on(t.ipAddress, t.createdAt), index().on(t.createdAt)],
)
