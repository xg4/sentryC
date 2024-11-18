import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { recordRoute } from './routes/record'
import { taskRoute } from './routes/task'

const app = new Hono()

app.use('*', logger())

app.get('/status', async c => {
  return c.json({
    status: 'ok',
    now: Date.now(),
  })
})

const apiRoutes = app.basePath('/api').route('/task', taskRoute).route('/record', recordRoute)

app.get('*', serveStatic({ root: './dist' }))
app.get('*', serveStatic({ path: './dist/index.html' }))

export default app

export type ApiRoutes = typeof apiRoutes
