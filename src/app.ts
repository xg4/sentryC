import { Hono } from 'hono'
import { routes } from './routes'

const app = new Hono()

app.route('/', routes)

app.onError((e, c) => {
  console.error(e)
  return c.json({ error: e.message }, 500)
})

export default app
