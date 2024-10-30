import fp from 'fastify-plugin'
import PQueue from 'p-queue'

const queuePlugin = fp(async (server, options) => {
  const queue = new PQueue(options)

  server.decorate('queue', queue)

  server.addHook('onClose', async server => {
    await server.queue.clear()
  })
})

export default queuePlugin
