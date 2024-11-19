import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { recordRoute } from './routes/record'
import { taskRoute } from './routes/task'

const app = new Hono()

const apiRoutes = app.basePath('/api').use('*', logger()).route('/task', taskRoute).route('/record', recordRoute)

app.use('*', serveStatic({ root: './dist' }))
app.use('*', serveStatic({ path: './dist/index.html' }))

export default app

export type ApiRoutes = typeof apiRoutes
