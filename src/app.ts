import { Hono } from 'hono'
import { requestId } from 'hono/request-id'
import { pinoLogger } from './middlewares/logger'
import { routes } from './routes'

const app = new Hono()

app.use(requestId())
app.use(pinoLogger)

app.route('/', routes)

app.onError((e, c) => {
  c.var.logger.error(e)
  return c.json('Internal Server Error', 500)
})

export default app
