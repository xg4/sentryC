import { compact, groupBy, last, map } from 'lodash-es'
import { nanoid } from 'nanoid'
import { fetchTargetIps } from '../services/ip.mjs'
import { calculateAverage, calculateStd } from '../utils/math.mjs'

export default function routes(app, _, done) {
  app.post('/task', async (_, reply) => {
    const values = [...app.cache.values()]
    const current = values.find(i => i.value !== 1)
    if (current) {
      reply.send(current.label)
      return
    }

    const taskId = nanoid(6)
    app.cache.set(taskId, { label: taskId, value: 0, createdAt: new Date() })

    app.queue.add(async () => {
      const ips = await fetchTargetIps()
      let index = 0
      const data = await Promise.all(
        ips.map(async ip => {
          const data = await app.runTask(ip)
          const saved = app.cache.get(taskId)
          saved.value = ++index / ips.length
          app.cache.set(taskId, saved)
          return data
        }),
      )
      await app.prisma.latencyRecord.createMany({
        data,
      })
    })

    reply.code(201).send(taskId)
  })

  app.get('/progress/:id', async (request, reply) => {
    const taskId = request.params.id
    const progress = app.cache.get(taskId)
    reply.send(progress && progress.value)
  })

  app.get('/task', async (_, reply) => {
    reply.send([...app.cache.values()])
  })

  app.get('/data', async (request, reply) => {
    const { gt, lt } = request.query
    const records = await app.prisma.latencyRecord.findMany({
      where: {
        createdAt: {
          gt,
          lt,
        },
      },
    })

    const grouped = groupBy(records, 'ip')

    const data = map(grouped, (items, label) => {
      const values = map(items, 'latency')
      if (values.every(i => i < 0)) {
        return null
      }
      const times = values.filter(i => i > 0)
      if (times.length < 1) {
        return null
      }
      const packetLossRate = (values.length - times.length) / values.length
      if (packetLossRate > 0.5) {
        return null
      }
      const average = calculateAverage(times)

      if (average > 200) {
        return null
      }
      const std = calculateStd(times, average)
      return {
        label,
        values,
        packetLossRate,
        average: average.toFixed(1),
        std: std.toFixed(1),
        createdAt: last(items).createdAt,
      }
    })

    reply.send(compact(data))
  })

  done()
}
