import cors from '@fastify/cors'
import { PrismaClient } from '@prisma/client'
import fastify from 'fastify'
import piscinaPlugin from 'fastify-piscina'
import { LRUCache } from 'lru-cache'
import PQueue from 'p-queue'
import { ZodError } from 'zod'
import cachePlugin from './plugins/cache.mjs'
import prismaPlugin from './plugins/prisma.mjs'
import queuePlugin from './plugins/queue.mjs'
import routes from './routes/index.mjs'

const app = fastify({
  logger: true,
})

app.register(cors)

/**
 * @typedef {import('fastify').FastifyInstance & { prisma: PrismaClient cache: LRUCache queue: PQueue }} Application
 */
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

app.setErrorHandler((error, request, reply) => {
  if (error instanceof ZodError) {
    const [err] = error.errors
    reply.status(400).send(err)
  } else if (error.validation) {
    reply.status(400).send({
      message: '请求参数错误',
      errors: error.validation,
    })
  } else if (error.statusCode) {
    // 针对特定的 HTTP 错误码
    reply.status(error.statusCode).send({
      message: error.message,
    })
  } else {
    // 其他未知错误
    reply.status(500).send({
      message: '服务器内部错误',
    })
  }

  // 记录错误日志
  request.log.error(error)
})

app.register(routes, {
  prefix: '/',
})

app.get('/status', async (_, reply) => {
  reply.send({
    status: 'ok',
    now: Date.now(),
  })
})

app.listen({ port: 8970, host: '0.0.0.0' }, function (err, address) {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
})
