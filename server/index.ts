import { serve } from '@hono/node-server'
import { z } from 'zod'
import app from './app'

const ServeEnv = z.object({
  PORT: z.coerce.number().int().default(8970),
  HOSTNAME: z.string().default('localhost'),
})

const ProcessEnv = ServeEnv.parse(process.env)

serve({
  fetch: app.fetch,
  port: ProcessEnv.PORT,
  hostname: ProcessEnv.HOSTNAME,
})

console.log(`🚀 ~ Server is running on http://${ProcessEnv.HOSTNAME}:${ProcessEnv.PORT}`)
