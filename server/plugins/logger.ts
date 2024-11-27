import { createMiddleware } from 'hono/factory'

export const logger = createMiddleware(async (c, next) => {
  const start = performance.now()
  await next()
  const ms = performance.now() - start

  console.debug([c.req.method, c.get('requestId'), c.req.path, c.res.status, ms.toFixed() + 'ms'].join(' '))
})
