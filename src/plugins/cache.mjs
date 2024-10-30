import fp from 'fastify-plugin'
import { LRUCache } from 'lru-cache'

const cachePlugin = fp(async (server, options) => {
  const cache = new LRUCache(options)

  server.decorate('cache', cache)

  server.addHook('onClose', async server => {
    await server.cache.clear()
  })
})

export default cachePlugin
