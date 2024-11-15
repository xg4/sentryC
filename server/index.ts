import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { recordRoute } from './routes/record.js'
import { taskRoute } from './routes/task.js'

const app = new Hono()

app.use(logger()).use(
  '/*',
  serveStatic({
    rewriteRequestPath: path => `./dist${path}`,
  }),
)

app.get('/status', async c => {
  return c.json({
    status: 'ok',
    now: Date.now(),
  })
})

app.route('/api', taskRoute).route('/api', recordRoute)

const port = 8970
console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port,
})
