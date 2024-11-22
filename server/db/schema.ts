import { relations, sql } from 'drizzle-orm'
import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { generateCuid2 } from '../utils/id'

export const ipTable = sqliteTable('ips', {
  address: text().primaryKey(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
})

export const latencyRecordTable = sqliteTable(
  'latency_records',
  {
    id: text()
      .primaryKey()
      .$default(() => generateCuid2()),
    latency: real().notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
    ipAddress: text('ip_address').notNull(),
  },
  table => ({
    ipIndex: uniqueIndex('ip_index').on(table.ipAddress, table.createdAt),
    createdAtIndex: index('created_at_index').on(table.createdAt),
  }),
)

export const ipsRelations = relations(ipTable, ({ many }) => ({
  latencyRecords: many(latencyRecordTable),
}))

export const latencyRecordsRelations = relations(latencyRecordTable, ({ one }) => ({
  ip: one(ipTable, {
    fields: [latencyRecordTable.ipAddress],
    references: [ipTable.address],
  }),
}))
