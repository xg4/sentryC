import { isEmpty } from 'lodash-es'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { getAllIps } from '../services/ip.mjs'
import { filterRecords, getRecordsByIp } from '../services/record.mjs'

/**
 * 定义应用程序的路由
 * @param {import('../app.mjs').Application} app - 应用程序对象
 * @param {Object} _ - 未使用的参数
 * @param {Function} done - 路由设置完成后的回调函数
 * @returns {void}
 */
export default function routes(app, _, done) {
  app.post('/task', async (req, reply) => {
    const values = [...app.cache.values()]
    const current = values.find(i => i.value !== 1)
    if (current) {
      reply.send(current.label)
      return
    }

    const taskId = nanoid(6)
    app.cache.set(taskId, { label: taskId, value: 0, createdAt: new Date() })

    app.queue.add(async () => {
      const ips = await getAllIps(app.prisma)
      let index = 0
      const records = await Promise.all(
        ips.map(async ip => {
          const latency = await app.runTask(ip.address)
          const saved = app.cache.get(taskId)
          saved.value = ++index / ips.length
          app.cache.set(taskId, saved)
          return {
            ...ip,
            latency,
          }
        }),
      )
      const list = records.filter(i => i.latency > 0)
      if (isEmpty(list)) {
        req.log.error(`task-${taskId} failed`)
        return
      }
      req.log.info(`task-${taskId} ${list.length}/${records.length}`)

      await app.prisma.latencyRecord.createMany({
        data: records.map(i => ({
          ipId: i.id,
          latency: i.latency,
        })),
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

  const queryRecordSchema = z.object({
    gt: z.string().datetime(),
    lt: z.string().datetime(),
  })

  app.get('/record', async (request, reply) => {
    const query = queryRecordSchema.parse(request.query)
    const records = await getRecordsByIp(app.prisma, query)
    reply.send(filterRecords(records))
  })

  const paramRecordSchema = z.object({
    ip: z.string().ip(),
  })

  app.get('/record/:ip', async (request, reply) => {
    const query = queryRecordSchema.parse(request.query)
    const params = paramRecordSchema.parse(request.params)
    const records = await getRecordsByIp(app.prisma, { ...query, ...params })
    reply.send(records)
  })

  done()
}
