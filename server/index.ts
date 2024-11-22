import { serve } from '@hono/node-server'
import app from './app'
import { ProcessEnv } from './env'

serve({
  fetch: app.fetch,
  port: ProcessEnv.PORT,
  hostname: ProcessEnv.HOSTNAME,
})

console.log(`\n\n🚀 ~ Server is running on http://${ProcessEnv.HOSTNAME}:${ProcessEnv.PORT}`)
