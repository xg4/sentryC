import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { requestId } from 'hono/request-id'
import './plugins/cron'
import { logger } from './plugins/logger'
import { recordRoute } from './routes/record'
import { taskRoute } from './routes/task'

const app = new Hono()

const apiRoutes = app
  .basePath('/api')
  .use(requestId())
  .use(logger)
  .route('/task', taskRoute)
  .route('/record', recordRoute)

app.use('*', serveStatic({ root: './client/dist' }))
app.use('*', serveStatic({ path: './client/dist/index.html' }))

export default app

export type ApiRoutes = typeof apiRoutes
