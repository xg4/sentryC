import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { recordRoute } from './routes/record.js'
import { taskRoute } from './routes/task.js'

const app = new Hono()

app.use('*', cors())

app.get('/status', async c => {
  return c.json({
    status: 'ok',
    now: Date.now(),
  })
})

app.route('/task', taskRoute)
app.route('/record', recordRoute)

const port = 8907
console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port,
})
