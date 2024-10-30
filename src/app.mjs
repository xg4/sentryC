import fastify from 'fastify'
import piscinaPlugin from 'fastify-piscina'
import cachePlugin from './plugins/cache.mjs'
import prismaPlugin from './plugins/prisma.mjs'
import queuePlugin from './plugins/queue.mjs'
import routes from './routes/index.mjs'

const app = fastify({
  logger: true,
})

app.register(queuePlugin, {
  concurrency: 1,
})

app.register(cachePlugin, {
  max: 500,
})

app.register(prismaPlugin)

app.register(piscinaPlugin, {
  concurrentTasksPerWorker: 10,
  filename: new URL('./worker.mjs', import.meta.url).href,
})

app.register(routes, {
  prefix: '/api',
})

app.listen({ port: 3030, host: '0.0.0.0' }, function (err, address) {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
})
