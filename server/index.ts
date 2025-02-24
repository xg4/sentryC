import { serve } from '@hono/node-server'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import app from './app'
import { db } from './db'
import { ProcessEnv } from './env'
import { initSchedules } from './utils/schedules'

await migrate(db, { migrationsFolder: './drizzle' })

await initSchedules()

serve({
  port: ProcessEnv.PORT,
  hostname: ProcessEnv.HOSTNAME,
  fetch: app.fetch,
})

console.log('🚀 ~ serve:', `http://${ProcessEnv.HOSTNAME}:${ProcessEnv.PORT}`)
